import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonClass, inputClass, Modal, PageTitle, useOffice } from "@/components/chrome";
import { agencyName, statusLabel } from "@/lib/labels";
import { listProperties, listStaff, saveProperty } from "@/lib/office";
import { useEffect, useState } from "react";
import { PropertyForm, emptyProperty } from "@/components/property-form";

export const Route = createFileRoute("/properties/")({ component: PropertiesPage });

function PropertiesPage() {
  const { agency } = useOffice();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listProperties>>>([]);
  const [staff, setStaff] = useState<Awaited<ReturnType<typeof listStaff>>>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("available");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

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
          <Link key={row.id} to="/properties/$propertyId" params={{ propertyId: String(row.id) }} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{row.address}</p>
                <p className="text-sm text-muted">{agencyName(row.agency)} · {row.landlordName || "Landlord to be added"} · {row.viewings} viewings</p>
              </div>
              <span className="text-sm">{statusLabel(row.status)}</span>
            </div>
          </Link>
        ))}
      </div>
      {open ? (
        <Modal title="Add property" onClose={() => setOpen(false)}>
          <PropertyForm
            staff={staff}
            initial={{ ...emptyProperty, agency: agency === "gr" ? "gr" : "al" }}
            onCancel={() => setOpen(false)}
            onSave={async (value) => {
              await saveProperty({ data: value });
              setOpen(false);
              load();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

