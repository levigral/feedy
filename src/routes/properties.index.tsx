import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonClass, Field, inputClass, Modal, PageTitle, quietClass, useOffice } from "@/components/chrome";
import { agencyName, statusLabel } from "@/lib/labels";
import { archiveProperty, listProperties, listStaff, saveProperty } from "@/lib/office";
import { useEffect, useState } from "react";
import { PropertyForm, emptyProperty, type PropertyFormValue, DuplicatePropertyPrompt } from "@/components/property-form";

export const Route = createFileRoute("/properties/")({ component: PropertiesPage });

function PropertiesPage() {
  const { agency, me } = useOffice();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listProperties>>>([]);
  const [staff, setStaff] = useState<Awaited<ReturnType<typeof listStaff>>>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("available");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [remove, setRemove] = useState<{ id: number; address: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState<PropertyFormValue | null>(null);
  const [clash, setClash] = useState<{ id: number; address: string; postcode: string; status: string } | null>(null);

  function load() {
    listProperties().then(setRows).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load properties"));
    listStaff().then(setStaff).catch(() => undefined);
  }
  useEffect(load, []);
  useEffect(() => {
    if (window.location.hash === "#add") setOpen(true);
  }, []);

  const visible = rows.filter((row) => {
    if (agency !== "all" && row.agency !== agency) return false;
    if (status !== "all" && row.status !== status) return false;
    const hay = `${row.address} ${row.postcode} ${row.landlordName}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  return (
    <div>
      <PageTitle title="Properties" action={<button type="button" className={buttonClass} onClick={() => setOpen(true)}>Add property</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={inputClass + " max-w-sm"} placeholder="Search address or landlord" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className={inputClass + " max-w-48"} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="available">Available</option>
          <option value="let_agreed">Let agreed</option>
          <option value="let">Let</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="all">All statuses</option>
        </select>
      </div>
      {error ? <p className="mb-3 text-sm text-bad">{error}</p> : null}
      <div className="grid gap-2">
        {visible.length === 0 ? <p className="text-sm text-muted">No properties on this list. Import a diary or add one.</p> : visible.map((row) => (
          <article key={row.id} className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <Link to="/properties/$propertyId" params={{ propertyId: String(row.id) }}>
              <p className="font-medium">{row.address}</p>
              <p className="text-sm text-muted">{agencyName(row.agency)} · {row.landlordName || "Landlord to be added"} · {row.viewings} viewings · {statusLabel(row.status)}</p>
            </Link>
            {me?.role === "admin" ? (
              <button
                type="button"
                className={quietClass}
                onClick={() => { setConfirmText(""); setRemove({ id: row.id, address: row.address }); }}
              >
                Delete
              </button>
            ) : null}
          </article>
        ))}
      </div>
      {open ? (
        <Modal title="Add property" onClose={() => setOpen(false)}>
          <PropertyForm
            staff={staff}
            initial={{ ...emptyProperty, agency: agency === "gr" ? "gr" : "al" }}
            onCancel={() => setOpen(false)}
            onSave={async (value) => {
              const saved = await saveProperty({ data: value });
              if (saved.duplicate) {
                setPending(value);
                setClash(saved.duplicate);
                return;
              }
              setOpen(false);
              load();
            }}
          />
        </Modal>
      ) : null}
      {clash && pending ? (
        <Modal title="This property is already on the system" onClose={() => { setClash(null); setPending(null); }}>
          <DuplicatePropertyPrompt
            address={clash.address}
            postcode={clash.postcode}
            status={clash.status}
            onSkip={() => { setClash(null); setPending(null); setOpen(false); }}
            onAddAnyway={() => {
              void saveProperty({ data: { ...pending, allowDuplicate: true } })
                .then(() => { setClash(null); setPending(null); setOpen(false); load(); })
                .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not add the property"));
            }}
          />
        </Modal>
      ) : null}
      {remove ? (
        <Modal title="Delete this property" onClose={() => setRemove(null)}>
          <p className="text-sm">This removes {remove.address}, including its viewings and feedback. Type DELETE in capital letters to confirm.</p>
          <div className="mt-3">
            <Field label="Type DELETE">
              <input className={inputClass} value={confirmText} autoComplete="off" onChange={(event) => setConfirmText(event.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              disabled={confirmText !== "DELETE"}
              onClick={() => {
                void archiveProperty({ data: { id: remove.id, hard: true } })
                  .then(() => { setRemove(null); load(); })
                  .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not delete the property"));
              }}
            >
              Delete property
            </button>
            <button type="button" className={quietClass} onClick={() => setRemove(null)}>Cancel</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

