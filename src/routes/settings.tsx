import { createFileRoute } from "@tanstack/react-router";
import { buttonClass, Field, inputClass, PageTitle, useOffice } from "@/components/chrome";
import { agencyName } from "@/lib/labels";
import { getSettings, listStaff, resetStaffPassword, saveBranchGmail, saveGmailTrial, sendBranchGmailTest, sendGmailTest } from "@/lib/office";
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
        Add a separate Gmail address for each branch. An Andrew Lees viewing sends from the Andrew Lees Gmail. A Gibbins Richards viewing sends from the Gibbins Richards Gmail.
      </p>
      <div className="mt-4 grid gap-4">
        {rows.filter((row) => row.agency === "al" || row.agency === "gr").map((row) => (
          <BranchGmail key={row.agency} row={row} canEdit={canEdit} onSaved={(text) => { setMessage(text); getSettings().then(setRows); }} />
        ))}
      </div>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        The box below is only a backup. Use it if you want one Gmail for both branches. A branch with its own Gmail switched on will not use this.
      </p>
      <GmailTrial
        row={rows.find((row) => row.agency === "gmail")}
        canEdit={canEdit}
        onSaved={(text) => { setMessage(text); getSettings().then(setRows); }}
      />
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

function BranchGmail({
  row,
  canEdit,
  onSaved,
}: {
  row: Awaited<ReturnType<typeof getSettings>>[number];
  canEdit: boolean;
  onSaved: (message: string) => void;
}) {
  const savedGmail = row.kind === "smtp" && /@gmail\.com$|@googlemail\.com$/i.test(row.fromAddress);
  const [address, setAddress] = useState(savedGmail ? row.fromAddress : "");
  const [appPassword, setAppPassword] = useState("");
  const [live, setLive] = useState(savedGmail ? row.live : false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAddress(savedGmail ? row.fromAddress : "");
    setLive(savedGmail ? row.live : false);
  }, [row.fromAddress, row.live, row.kind, savedGmail]);
  const ready = savedGmail && row.live;
  return (
    <form
      className="grid max-w-2xl gap-3 rounded-2xl border border-line bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        saveBranchGmail({ data: { agency: row.agency, address, appPassword, live } })
          .then(() => onSaved(live ? `${agencyName(row.agency)} will send from ${address}` : `${agencyName(row.agency)} saved, but not sending yet`))
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">{agencyName(row.agency)}</h2>
        <span className={`rounded-full px-2 py-1 text-xs ${ready ? "bg-good-bg text-good" : "bg-wait-bg text-wait"}`}>{ready ? "Sending from this Gmail" : "Not sending yet"}</span>
      </div>
      <p className="text-sm text-muted">Create an app password in this Gmail account at Google Account, then App passwords. Name it Feedy. Do not use the normal Gmail password.</p>
      <Field label="Gmail address"><input className={inputClass} type="email" value={address} placeholder="name@gmail.com" onChange={(event) => setAddress(event.target.value)} disabled={!canEdit} required /></Field>
      <Field label="App password"><input className={inputClass} value={appPassword} placeholder={savedGmail && row.hasSecret ? "Saved — paste a new one to replace it" : "16-character app password"} onChange={(event) => setAppPassword(event.target.value)} disabled={!canEdit} autoComplete="off" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} disabled={!canEdit} /> Send feedback from this Gmail</label>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save this Gmail"}</button>
          <button
            type="button"
            className="h-11 rounded-full border border-line px-4 text-sm"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError("");
              sendBranchGmailTest({ data: { agency: row.agency, address, appPassword } })
                .then(() => onSaved(`Test sent to ${address}`))
                .catch((err: unknown) => setError(err instanceof Error ? err.message : "Gmail refused the test"))
                .finally(() => setBusy(false));
            }}
          >
            Send a test to this Gmail
          </button>
        </div>
      ) : <p className="text-sm text-muted">A manager needs to save this.</p>}
    </form>
  );
}
