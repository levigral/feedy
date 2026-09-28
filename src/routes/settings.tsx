import { createFileRoute } from "@tanstack/react-router";
import { buttonClass, Field, inputClass, PageTitle, useOffice } from "@/components/chrome";
import { agencyName } from "@/lib/labels";
import { getSettings, listStaff, resetStaffPassword, saveGmailTrial, saveMailbox, sendGmailTest } from "@/lib/office";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { me } = useOffice();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getSettings>>>([]);
  const [message, setMessage] = useState("");
  const canEdit = me?.role === "admin" || me?.role === "manager";

  useEffect(() => {
    getSettings().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div>
      <PageTitle title="Settings" />
      {me?.role === "admin" ? <PasswordReset onSaved={setMessage} /> : <p className="mb-4 text-sm text-muted">Only an administrator can reset a password.</p>}
      {message ? <p className="mb-3 text-sm text-good">{message}</p> : null}
      <p className="max-w-2xl text-sm text-muted">
        For a trial, send from your own Gmail. Landlords will see that address, not the agency one. The agency mailboxes below are for Microsoft 365 when you are ready to send as the office.
      </p>
      <GmailTrial
        row={rows.find((row) => row.agency === "gmail")}
        canEdit={canEdit}
        onSaved={(text) => { setMessage(text); getSettings().then(setRows); }}
      />
      <p className="mt-8 max-w-2xl text-sm text-muted">
        Andrew Lees uses bridgwater@andrewleeslettings.co.uk. Gibbins Richards uses lettings@gibbinsrichards.co.uk.
      </p>
      <ol className="mt-4 grid max-w-2xl list-decimal gap-2 pl-5 text-sm text-muted">
        <li>In Microsoft Entra, register an app in the Microsoft 365 account that owns the mailbox.</li>
        <li>Add the application permission Mail.Send and grant admin consent.</li>
        <li>Limit the app to these mailboxes with an application access policy.</li>
        <li>Paste the tenant ID, application ID and client secret below, then tick send live.</li>
      </ol>
      <div className="mt-6 grid gap-4">
        {rows.filter((row) => row.agency === "al" || row.agency === "gr").map((row) => (
          <MailboxCard key={row.agency} row={row} canEdit={canEdit} onSaved={(text) => { setMessage(text); getSettings().then(setRows); }} />
        ))}
      </div>
    </div>
  );
}

function PasswordReset({ onSaved }: { onSaved: (message: string) => void }) {
  const [people, setPeople] = useState<Awaited<ReturnType<typeof listStaff>>>([]);
  const [id, setId] = useState(0);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listStaff().then((rows) => {
      setPeople(rows);
      const first = rows.find((person) => person.username);
      if (first) setId(first.id);
    }).catch(() => setPeople([]));
  }, []);

  const chosen = people.find((person) => person.id === id);

  return (
    <form
      className="mb-8 grid max-w-2xl gap-3 rounded-2xl border border-line bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        resetStaffPassword({ data: { id, password } })
          .then((result) => {
            setPassword("");
            onSaved(`Password reset for ${result.name}. Tell them the new one. They will choose their own the next time they sign in.`);
          })
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not reset the password"))
          .finally(() => setBusy(false));
      }}
    >
      <h2 className="font-display text-2xl">Reset a password</h2>
      <p className="text-sm text-muted">If someone has forgotten their login, set a new password here and tell them what it is.</p>
      <Field label="Staff member">
        <select className={inputClass} value={id} onChange={(event) => setId(Number(event.target.value))}>
          {people.filter((person) => person.username).map((person) => (
            <option key={person.id} value={person.id}>{person.name} · {person.username}</option>
          ))}
        </select>
      </Field>
      {people.some((person) => person.username) ? null : <p className="text-sm text-muted">No one has a username yet. Add one on the Staff page first.</p>}
      <Field label="New password">
        <div className="relative">
          <input className={inputClass + " pr-12"} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoComplete="new-password" />
          <button type="button" className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      {chosen ? <p className="text-sm text-muted">They sign in as {chosen.username}.</p> : null}
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <button className={buttonClass} disabled={busy || !id}>{busy ? "Saving…" : "Reset password"}</button>
    </form>
  );
}

function GmailTrial({
  row,
  canEdit,
  onSaved,
}: {
  row: Awaited<ReturnType<typeof getSettings>>[number] | undefined;
  canEdit: boolean;
  onSaved: (message: string) => void;
}) {
  const [address, setAddress] = useState(row?.fromAddress ?? "");
  const [appPassword, setAppPassword] = useState("");
  const [live, setLive] = useState(row?.live ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAddress(row?.fromAddress ?? "");
    setLive(row?.live ?? false);
  }, [row?.fromAddress, row?.live]);
  return (
    <form
      className="mt-4 grid max-w-2xl gap-3 rounded-2xl border border-line bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        saveGmailTrial({ data: { address, appPassword, live } })
          .then(() => onSaved(live ? "Gmail trial is on" : "Gmail trial saved, but not sending"))
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Gmail trial</h2>
        <span className={`rounded-full px-2 py-1 text-xs ${row?.live ? "bg-good-bg text-good" : "bg-wait-bg text-wait"}`}>{row?.live ? "Sending from Gmail" : "Not sending yet"}</span>
      </div>
      <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted">
        <li>On the Google account, turn on 2-Step Verification.</li>
        <li>Open Google Account, search for App passwords, and create one named Feedy.</li>
        <li>Paste that 16-character password below. Do not use your normal Gmail password.</li>
        <li>Tick send from this Gmail, save, then send a test to yourself.</li>
      </ol>
      <Field label="Gmail address"><input className={inputClass} value={address} placeholder="name@gmail.com" onChange={(event) => setAddress(event.target.value)} disabled={!canEdit} /></Field>
      <Field label="App password"><input className={inputClass} value={appPassword} placeholder={row?.hasSecret ? "Saved — paste a new one to replace it" : "16-character app password"} onChange={(event) => setAppPassword(event.target.value)} disabled={!canEdit} autoComplete="off" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} disabled={!canEdit} /> Send landlord emails from this Gmail</label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={busy}>Save Gmail trial</button>
          <button
            type="button"
            className="h-11 rounded-full border border-line px-4 text-sm"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError("");
              sendGmailTest({ data: { address, appPassword } })
                .then(() => onSaved(`Test sent to ${address}`))
                .catch((err: unknown) => setError(err instanceof Error ? err.message : "Gmail refused the test"))
                .finally(() => setBusy(false));
            }}
          >
            Send a test to me
          </button>
        </div>
      ) : <p className="text-sm text-muted">A manager needs to save this.</p>}
    </form>
  );
}

function MailboxCard({
  row,
  canEdit,
  onSaved,
}: {
  row: Awaited<ReturnType<typeof getSettings>>[number];
  canEdit: boolean;
  onSaved: (message: string) => void;
}) {
  const [tenantId, setTenantId] = useState(row.tenantId);
  const [clientId, setClientId] = useState(row.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [live, setLive] = useState(row.live);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3 rounded-2xl border border-line bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        saveMailbox({ data: { agency: row.agency, tenantId, clientId, clientSecret, live } })
          .then(() => onSaved(`${agencyName(row.agency)} saved`))
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"));
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">{agencyName(row.agency)}</h2>
        <span className={`rounded-full px-2 py-1 text-xs ${row.live ? "bg-good-bg text-good" : "bg-wait-bg text-wait"}`}>{row.live ? "Connected" : "Not sending yet"}</span>
      </div>
      <p className="text-sm text-muted">Sends as {row.fromAddress}</p>
      <Field label="Tenant ID"><input className={inputClass} value={tenantId} onChange={(event) => setTenantId(event.target.value)} disabled={!canEdit} /></Field>
      <Field label="Application ID"><input className={inputClass} value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={!canEdit} /></Field>
      <Field label="Client secret"><input className={inputClass} value={clientSecret} placeholder={row.hasSecret ? "Saved — paste a new secret to replace it" : "Paste the secret"} onChange={(event) => setClientSecret(event.target.value)} disabled={!canEdit} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} disabled={!canEdit} /> Send live via Microsoft Graph</label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      {canEdit ? <button className={buttonClass}>Save mailbox</button> : <p className="text-sm text-muted">A manager needs to save this.</p>}
    </form>
  );
}
