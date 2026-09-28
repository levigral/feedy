import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonClass, Field, inputClass, Modal, PageTitle, quietClass, useOffice } from "@/components/chrome";
import { StaffTable } from "@/components/staff-table";
import { formatUk } from "@/lib/labels";
import { getBoard, listStaff, saveStaff } from "@/lib/office";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/staff")({ component: StaffPage });

type Person = Awaited<ReturnType<typeof listStaff>>[number];

function StaffPage() {
  const { me } = useOffice();
  const [staff, setStaff] = useState<Person[]>([]);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof getBoard>>["queue"]>([]);
  const [editing, setEditing] = useState<Person | "new" | null>(null);
  const [error, setError] = useState("");
  const canEdit = me?.role === "admin";

  function load() {
    listStaff().then(setStaff).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load staff"));
    getBoard({ data: {} }).then((board) => setQueue(board.queue)).catch(() => setQueue([]));
  }
  useEffect(load, []);

  return (
    <div>
      <PageTitle title="Staff" action={canEdit ? <button type="button" className={buttonClass} onClick={() => setEditing("new")}>Add staff</button> : null} />
      {error ? <p className="mb-3 text-sm text-bad">{error}</p> : null}
      <StaffTable staff={staff} />
      <h2 className="mt-8 font-display text-2xl">Feedback to chase</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">Outstanding viewings are already on the negotiator who did them. Chased is the share of their viewings emailed to the landlord.</p>
      <div className="mt-3 grid gap-3">
        {staff.filter((person) => person.outstanding > 0).map((person) => {
          const chased = person.viewings ? Math.round((person.done / person.viewings) * 100) : 0;
          const rows = queue.filter((viewing) => viewing.negotiatorId === person.id);
          return (
            <article key={person.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">{person.name}</h3>
                <p className="text-sm text-muted">{person.outstanding} to chase · {chased}% chased</p>
              </div>
              <ul className="mt-2 grid gap-1">
                {rows.map((viewing) => (
                  <li key={viewing.id}>
                    <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} search={{ feedback: viewing.id }} className="text-sm text-pine">
                      {viewing.address} · {formatUk(viewing.viewedOn)} {viewing.time}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {staff.every((person) => person.outstanding === 0) ? <p className="text-sm text-muted">Nothing left to chase.</p> : null}
      </div>
      {canEdit ? (
        <ul className="mt-4 grid gap-2">
          {staff.map((person) => (
            <li key={person.id}>
              <button type="button" className={quietClass} onClick={() => setEditing(person)}>Edit {person.name}</button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-muted">Only an administrator can add staff or set passwords.</p>}
      {editing ? (
        <Modal title={editing === "new" ? "Add staff" : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <StaffForm
            initial={editing === "new" ? { id: 0, name: "", email: "", username: "", role: "negotiator", agency: "al", active: true } : editing}
            onCancel={() => setEditing(null)}
            onSave={async (value) => {
              await saveStaff({ data: value });
              setEditing(null);
              load();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function StaffForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { id: number; name: string; email: string; username?: string; role: string; agency: string; active: boolean };
  onSave: (value: { id?: number; name: string; email: string; username: string; password: string; role: string; agency: string; active: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [username, setUsername] = useState(initial.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(initial.role);
  const [agency, setAgency] = useState(initial.agency);
  const [active, setActive] = useState(initial.active);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        onSave({ id: initial.id || undefined, name, email, username, password, role, agency, active }).catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Could not save");
          setBusy(false);
        });
      }}
    >
      <Field label="Name"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required /></Field>
      <Field label="Username"><input className={inputClass} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" required={!initial.id} /></Field>
      <Field label={initial.id ? "New password" : "First password"}>
        <div className="relative">
          <input className={inputClass + " pr-12"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder={initial.id ? "Leave blank to keep the current password" : "At least 8 characters"} required={!initial.id} minLength={password ? 8 : undefined} />
          <button type="button" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <p className="text-sm text-muted">They use this username and password to sign in, then choose their own password the first time.</p>
      <Field label="Email"><input className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
      <Field label="Role">
        <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="negotiator">Negotiator</option>
          <option value="manager">Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </Field>
      <Field label="Agency">
        <select className={inputClass} value={agency} onChange={(event) => setAgency(event.target.value)}>
          <option value="al">Andrew Lees Lettings</option>
          <option value="gr">Gibbins Richards Lettings</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Account active</label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="sticky bottom-0 flex gap-2 bg-card py-2">
        <button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className={quietClass} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
