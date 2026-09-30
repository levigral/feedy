import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Badge, buttonClass, Field, inputClass, Modal, Progress, quietClass, useOffice } from "@/components/chrome";
import { UkDateInput } from "@/components/uk-date";
import { PropertyForm } from "@/components/property-form";
import { agencyEmail, agencyName, ageLabel, feedbackTone, formatUk, isFeedbackComplete, statusLabel, todayIso } from "@/lib/labels";
import { addViewing, archiveProperty, decideApplication, emailDraft, getProperty, getSettings, listStaff, markApplication, markContacted, saveFeedback, saveLandlord, saveProperty, sendFeedback, setLetAgreed } from "@/lib/office";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/properties/$propertyId")({
  validateSearch: (search: Record<string, unknown>): { feedback?: number } => {
    const feedback = Number(search.feedback);
    return feedback ? { feedback } : {};
  },
  component: PropertyPage,
});

const FEEDBACK_OPTIONS = [
  ["interested", "Interested"],
  ["not_interested", "Not interested"],
  ["no_feedback", "Feedback not given"],
  ["no_show", "No show"],
  ["cancelled", "Cancelled viewing"],
] as const;

function selectedInterest(interest: string): string {
  if (interest === "interested" || interest === "very_interested") return "interested";
  if (interest === "not_interested" || interest === "no_feedback" || interest === "no_show" || interest === "cancelled") return interest;
  return "";
}

function PropertyPage() {
  const { propertyId } = Route.useParams();
  const { feedback } = Route.useSearch();
  const { me } = useOffice();
  const navigate = useNavigate();
  const [data, setData] = useState<Awaited<ReturnType<typeof getProperty>> | null>(null);
  const [staff, setStaff] = useState<Awaited<ReturnType<typeof listStaff>>>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [mailId, setMailId] = useState<number | null>(null);
  const [letOpen, setLetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  function load() {
    getProperty({ data: { id: Number(propertyId) } })
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not open this property"));
    listStaff().then(setStaff).catch(() => undefined);
  }
  useEffect(load, [propertyId]);
  useEffect(() => {
    if (feedback) setFeedbackId(feedback);
  }, [feedback]);

  if (error) return <p className="text-bad">{error}</p>;
  if (!data) return <p className="text-muted">Loading property…</p>;
  const property = data.property;
  const pastViewings = property.historicViewings ?? property.viewings;
  const pastDone = property.historicDone ?? property.feedbackDone;
  const percent = pastViewings ? Math.round((pastDone / pastViewings) * 100) : 100;
  const letDays = property.letAgreedOn && property.firstViewing ? daysBetween(property.firstViewing, property.letAgreedOn) : null;
  const feedbackViewing = data.viewings.find((row) => row.id === feedbackId) ?? null;
  const mailViewing = data.viewings.find((row) => row.id === mailId) ?? null;

  return (
    <div>
      <Link to="/properties" className="text-sm text-muted">All properties</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{property.address}</h1>
          <p className="text-sm text-muted">{agencyName(property.agency)} · {statusLabel(property.status)} · {property.postcode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={() => setViewingOpen(true)}>Add viewing</button>
          <button type="button" className={quietClass} onClick={() => setEditing(true)}>Edit</button>
          {me?.role === "admin" ? (
            <button type="button" className={quietClass} onClick={() => { setConfirmText(""); setDeleteOpen(true); }}>Delete</button>
          ) : null}
        </div>
      </div>
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-card p-4 sm:col-span-2">
          <p className="font-display text-2xl">{property.status === "let_agreed" || property.status === "let" ? `${property.viewings} viewings to let` : `${property.viewings} viewings so far`}</p>
          <p className="text-sm text-muted">{property.feedbackDone} emailed to the landlord · {property.viewings - property.feedbackDone} outstanding · {percent}% of past viewings. Today is not counted until tomorrow.</p>
          <div className="mt-3"><Progress value={percent} /></div>
          {property.letAgreedOn ? <p className="mt-2 text-sm">Agreed by {property.letAgreedByName || "staff"} on {formatUk(property.letAgreedOn)}{letDays != null ? ` · ${letDays} days from the first viewing` : ""}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {property.status === "let_agreed" ? (
              <button type="button" className={quietClass} onClick={() => { void setLetAgreed({ data: { id: property.id, staffId: me?.id ?? 0, on: todayIso(), revert: true } }).then(load); }}>Put back on the market</button>
            ) : (
              <button type="button" className={quietClass} onClick={() => setLetOpen(true)}>Mark let agreed</button>
            )}
          </div>
        </article>
        <article className="rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="font-medium">{property.landlordName || "Landlord to be added"}</p>
          {property.landlordName2 ? <p className="mt-1">{property.landlordName2}</p> : null}
          {property.landlordPhone ? <a className="mt-1 block text-pine" href={`tel:${property.landlordPhone}`}>{property.landlordPhone}</a> : <p className="mt-1 text-muted">No phone yet</p>}
          {property.landlordEmail ? <a className="block text-pine" href={`mailto:${property.landlordEmail}`}>{property.landlordEmail}</a> : <p className="text-muted">No email yet</p>}
          {property.landlordEmail2 ? <a className="block text-pine" href={`mailto:${property.landlordEmail2}`}>{property.landlordEmail2}</a> : null}
          <p className="mt-2 text-muted">Rent {property.rent || "not set"}</p>
          <button type="button" className={`${quietClass} mt-3`} onClick={() => setEditing(true)}>Landlord and details</button>
        </article>
      </section>
      <h2 className="mt-8 font-display text-2xl">Viewings</h2>
      <div className="mt-3 grid gap-2">
        {data.viewings.length === 0 ? <p className="text-sm text-muted">No viewings yet.</p> : data.viewings.map((viewing) => (
          <article key={viewing.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{formatUk(viewing.viewedOn)} {viewing.time} · {viewing.viewerName || "Viewer not named"}</p>
                <p className="text-sm text-muted">{viewing.negotiatorName || "Unassigned"}</p>
                {viewing.feedbackText ? <p className="mt-2 text-sm">{viewing.feedbackText}</p> : null}
              </div>
              <Badge tone={feedbackTone(viewing.status, viewing.days)}>{ageLabel(viewing.days, viewing.status)} · {statusLabel(viewing.status)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={buttonClass} onClick={() => setFeedbackId(viewing.id)}>Add feedback</button>
              {isFeedbackComplete(viewing.status) ? (
                <span className="inline-flex h-11 items-center rounded-full bg-good-bg px-4 text-sm text-good">Completed</span>
              ) : viewing.status === "requested" ? (
                <span className="inline-flex h-11 items-center rounded-full bg-wait-bg px-4 text-sm text-wait">Contacted</span>
              ) : (
                <button type="button" className={quietClass} onClick={() => { void markContacted({ data: { id: viewing.id } }).then(load).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not mark contacted")); }}>Mark contacted</button>
              )}
              <button type="button" className={quietClass} onClick={() => setMailId(viewing.id)}>Email landlord</button>
              {viewing.interest === "interested" || viewing.interest === "very_interested" ? (
                viewing.applicationStatus === "accepted" ? (
                  <button type="button" className={quietClass} onClick={() => { void decideApplication({ data: { id: viewing.id, decision: "undo" } }).then(load).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not undo")); }}>Undo accept</button>
                ) : viewing.applicationStatus === "declined" ? (
                  <span className="inline-flex h-11 items-center rounded-full bg-bad-bg px-4 text-sm text-bad">Application declined</span>
                ) : viewing.applicationStatus === "across" ? (
                  <button type="button" className={quietClass} onClick={() => { void markApplication({ data: { id: viewing.id, across: false } }).then(load); }}>Application with landlord</button>
                ) : (
                  <button type="button" className={buttonClass} onClick={() => { void markApplication({ data: { id: viewing.id, across: true } }).then(load); }}>Application sent to landlord</button>
                )
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <h2 className="mt-8 font-display text-2xl">Activity</h2>
      <ul className="mt-3 grid gap-2">
        {data.activity.map((item, index) => (
          <li key={`${item.at}-${index}`} className="rounded-xl bg-card px-3 py-2 text-sm">
            <span className="font-medium">{item.kind}</span> · {item.detail} · {item.actor}
          </li>
        ))}
      </ul>
      {data.emails.length ? (
        <>
          <h2 className="mt-8 font-display text-2xl">Emails</h2>
          <ul className="mt-3 grid gap-2">
            {data.emails.map((email) => (
              <li key={email.id} className="rounded-xl bg-card px-3 py-2 text-sm">
                {email.status === "sent" ? "Sent" : "Not sent"} from {email.from} to {email.to} · {email.sender}
                {email.error ? <span className="block text-bad">{email.error}</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {editing ? (
        <Modal title="Edit property" onClose={() => setEditing(false)}>
          <PropertyForm
            staff={staff}
            initial={{
              id: property.id,
              address: property.address,
              postcode: property.postcode,
              agency: property.agency,
              rent: property.rent,
              landlordName: property.landlordName,
              landlordEmail: property.landlordEmail,
              landlordPhone: property.landlordPhone,
              landlordEmail2: property.landlordEmail2,
              landlordName2: property.landlordName2,
              status: property.status,
              marketedOn: property.marketedOn ?? "",
              negotiatorId: property.negotiatorId,
              notes: property.notes,
            }}
            onCancel={() => setEditing(false)}
            onSave={async (value) => { await saveProperty({ data: value }); setEditing(false); load(); }}
          />
          {me?.role === "admin" || me?.role === "manager" ? (
            <button type="button" className="mt-3 text-sm text-bad" onClick={() => { void archiveProperty({ data: { id: property.id } }).then(() => { setEditing(false); load(); }); }}>Withdraw this property</button>
          ) : null}
        </Modal>
      ) : null}
      {viewingOpen ? <ViewingModal propertyId={property.id} staff={staff} defaultStaff={me?.id ?? 0} onClose={() => setViewingOpen(false)} onSaved={() => { setViewingOpen(false); load(); }} /> : null}
      {feedbackViewing ? (
        <FeedbackModal
          viewing={feedbackViewing}
          onClose={() => setFeedbackId(null)}
          onSaved={() => {
            const id = feedbackViewing.id;
            setFeedbackId(null);
            getProperty({ data: { id: Number(propertyId) } })
              .then((next) => {
                setData(next);
                setMailId(id);
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not refresh"));
          }}
        />
      ) : null}
      {mailViewing ? <MailModal viewing={{ ...mailViewing, landlordPhone: property.landlordPhone }} meName={me?.name ?? ""} onClose={() => setMailId(null)} onSaved={() => { setMailId(null); load(); }} onLandlord={load} /> : null}
      {letOpen ? (
        <Modal title="Mark let agreed" onClose={() => setLetOpen(false)}>
          <LetForm staff={staff} defaultStaff={property.negotiatorId ?? me?.id ?? 0} onCancel={() => setLetOpen(false)} onSave={async (staffId, on) => { await setLetAgreed({ data: { id: property.id, staffId, on } }); setLetOpen(false); load(); }} />
        </Modal>
      ) : null}
      {deleteOpen ? (
        <Modal title="Delete this property" onClose={() => setDeleteOpen(false)}>
          <p className="text-sm">This removes {property.address}, including its viewings and feedback. Type DELETE in capital letters to confirm.</p>
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
                void archiveProperty({ data: { id: property.id, hard: true } })
                  .then(() => { void navigate({ to: "/properties" }); })
                  .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not delete the property"));
              }}
            >
              Delete property
            </button>
            <button type="button" className={quietClass} onClick={() => setDeleteOpen(false)}>Cancel</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86400000);
}

function ViewingModal({ propertyId, staff, defaultStaff, onClose, onSaved }: { propertyId: number; staff: Array<{ id: number; name: string }>; defaultStaff: number; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [viewerPhone, setViewerPhone] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [negotiatorId, setNegotiatorId] = useState(defaultStaff);
  const [notes, setNotes] = useState("");
  const [immediate, setImmediate] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal title="Add viewing" onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void addViewing({ data: { propertyId, date, time, viewerName, viewerPhone, viewerEmail, negotiatorId, notes, immediate } }).then(onSaved).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save")); }}>
        <Field label="Date"><UkDateInput value={date} onChange={setDate} required /></Field>
        <Field label="Time"><input className={inputClass} value={time} onChange={(event) => setTime(event.target.value)} placeholder="10:30" /></Field>
        <Field label="Viewer"><input className={inputClass} value={viewerName} onChange={(event) => setViewerName(event.target.value)} /></Field>
        <Field label="Viewer phone"><input className={inputClass} value={viewerPhone} onChange={(event) => setViewerPhone(event.target.value)} /></Field>
        <Field label="Viewer email"><input className={inputClass} value={viewerEmail} onChange={(event) => setViewerEmail(event.target.value)} /></Field>
        <Field label="Negotiator">
          <select className={inputClass} value={negotiatorId} onChange={(event) => setNegotiatorId(Number(event.target.value))}>
            {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea className="min-h-20 w-full rounded-xl border border-line p-3" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={immediate} onChange={(event) => setImmediate(event.target.checked)} /> Feedback was taken at the viewing</label>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <button type="submit" className={buttonClass}>Save viewing</button>
      </form>
    </Modal>
  );
}

function FeedbackModal({ viewing, onClose, onSaved }: { viewing: { id: number; interest: string; feedbackText: string; feedback: Record<string, string>; viewedOn: string; time: string; negotiatorName: string; address: string; viewerName: string }; onClose: () => void; onSaved: () => void }) {
  const [interest, setInterest] = useState(selectedInterest(viewing.interest));
  const [feedbackText, setFeedbackText] = useState(viewing.feedbackText);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function save(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!interest) {
      setError("Choose Interested, Not interested, Feedback not given, No show, or Cancelled viewing.");
      return;
    }
    setBusy(true);
    setError("");
    void saveFeedback({ data: { id: viewing.id, interest, feedbackText: feedbackText.trim(), fields: viewing.feedback } })
      .then(onSaved)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not save");
        setBusy(false);
      });
  }
  return (
    <Modal title="Add feedback" onClose={onClose}>
      <form className="grid gap-3" onSubmit={save}>
        <div className="rounded-xl bg-paper px-3 py-2 text-sm">
          <p className="font-medium">{formatUk(viewing.viewedOn)} {viewing.time}</p>
          <p>{viewing.negotiatorName || "Negotiator not set"}</p>
          <p className="text-muted">{viewing.address}{viewing.viewerName ? ` · ${viewing.viewerName}` : ""}</p>
        </div>
        <div className="grid gap-2">
          {FEEDBACK_OPTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`h-12 rounded-xl border text-base ${interest === id ? "border-pine bg-pine text-pine-ink" : "border-line"}`}
              onClick={() => setInterest(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <Field label="Feedback given">
          <textarea className="min-h-28 w-full rounded-xl border border-line p-3" value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder="What the applicant said" />
        </Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <button type="submit" className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save feedback"}</button>
      </form>
    </Modal>
  );
}

function MailModal({
  viewing,
  meName,
  onClose,
  onSaved,
  onLandlord,
}: {
  viewing: { id: number; propertyId: number; address: string; viewedOn: string; time: string; agency: string; feedbackText: string; interest: string; landlordName: string; landlordEmail: string; landlordEmail2: string; landlordPhone?: string; negotiatorName: string };
  meName: string;
  onClose: () => void;
  onSaved: () => void;
  onLandlord: () => void;
}) {
  const [agency, setAgency] = useState(viewing.agency === "gr" ? "gr" : "al");
  const [landlordName, setLandlordName] = useState(viewing.landlordName);
  const [landlordEmail, setLandlordEmail] = useState(viewing.landlordEmail);
  const [landlordEmail2, setLandlordEmail2] = useState(viewing.landlordEmail2);
  const [to, setTo] = useState([viewing.landlordEmail, viewing.landlordEmail2].filter(Boolean).join(", "));
  const noFeedback = viewing.interest === "no_feedback" || viewing.interest === "no_show" || viewing.interest === "cancelled";
  const [subject, setSubject] = useState(`${noFeedback ? "Viewing update" : "Viewing feedback"} — ${viewing.address}`);
  const [body, setBody] = useState(emailDraft({
    landlord: viewing.landlordName,
    address: viewing.address,
    when: `${formatUk(viewing.viewedOn)} ${viewing.time}`.trim(),
    feedback: viewing.feedbackText,
    interest: viewing.interest,
    negotiator: viewing.negotiatorName || meName,
    agency,
  }));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mailboxes, setMailboxes] = useState<Awaited<ReturnType<typeof getSettings>>>([]);
  useEffect(() => {
    getSettings().then(setMailboxes).catch(() => setMailboxes([]));
  }, []);
  const branch = mailboxes.find((row) => row.agency === agency);
  const shared = mailboxes.find((row) => row.agency === "gmail" && row.live);
  const branchGmail = branch?.kind === "smtp" && branch.live ? branch.fromAddress : "";
  const fromAddress = branchGmail || shared?.fromAddress || branch?.fromAddress || agencyEmail(agency);
  const fromNote = branchGmail
    ? `This email will come from ${branchGmail} · ${agencyName(agency)}`
    : shared?.fromAddress
      ? `No Gmail is switched on for ${agencyName(agency)}. This email will come from the shared Gmail ${shared.fromAddress}.`
      : `From ${fromAddress} · ${agencyName(agency)}. Add this branch’s Gmail in Settings before sending.`;
  return (
    <Modal title="Email landlord" onClose={onClose} wide>
      <form className="grid gap-3" onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        sendFeedback({ data: { viewingId: viewing.id, agency, to, subject, body } })
          .then((result) => { setMessage(result.sent ? `Sent from ${result.from}` : result.error); if (result.sent) onSaved(); })
          .catch((err: unknown) => setMessage(err instanceof Error ? err.message : "Could not send"))
          .finally(() => setBusy(false));
      }}>
        <p className="text-sm text-muted">{fromNote}</p>
        <Field label="Landlord name"><input className={inputClass} value={landlordName} onChange={(event) => setLandlordName(event.target.value)} /></Field>
        <Field label="Landlord email">
          <input className={inputClass} value={landlordEmail} onChange={(event) => { const next = event.target.value; setLandlordEmail(next); setTo([next, landlordEmail2].filter(Boolean).join(", ")); }} placeholder="name@email.com" />
        </Field>
        <Field label="Second landlord email">
          <input className={inputClass} value={landlordEmail2} onChange={(event) => { const next = event.target.value; setLandlordEmail2(next); setTo([landlordEmail, next].filter(Boolean).join(", ")); }} />
        </Field>
        <button type="button" className={quietClass} onClick={() => { void saveLandlord({ data: { propertyId: viewing.propertyId, landlordName, landlordEmail, landlordEmail2, landlordPhone: viewing.landlordPhone ?? "" } }).then(() => { setMessage("Landlord email saved on the property and copied into To."); onLandlord(); }).catch((err: unknown) => setMessage(err instanceof Error ? err.message : "Could not save the landlord")); }}>Save landlord on the property</button>
        <p className="text-sm text-muted">Type the landlord email and it is copied into To straight away. Save it so the next email already has it. To send now, switch on the Gmail trial in Settings. <Link to="/settings" className="text-pine">Open Settings</Link></p>
        <Field label="Sending agency">
          <select className={inputClass} value={agency} onChange={(event) => {
            const next = event.target.value;
            setAgency(next);
            setBody(emailDraft({
              landlord: landlordName,
              address: viewing.address,
              when: `${formatUk(viewing.viewedOn)} ${viewing.time}`.trim(),
              feedback: viewing.feedbackText,
              interest: viewing.interest,
              negotiator: viewing.negotiatorName || meName,
              agency: next,
            }));
          }}>
            <option value="al">Andrew Lees Lettings</option>
            <option value="gr">Gibbins Richards Lettings</option>
          </select>
        </Field>
        <Field label="To"><input className={inputClass} value={to} onChange={(event) => setTo(event.target.value)} /></Field>
        <Field label="Subject"><input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
        <Field label="Message"><textarea className="min-h-64 w-full rounded-xl border border-line p-3" value={body} onChange={(event) => setBody(event.target.value)} /></Field>
        {message ? <p className="text-sm">{message}</p> : null}
        <button className={buttonClass} disabled={busy}>{busy ? "Sending…" : "Send"}</button>
      </form>
    </Modal>
  );
}

function LetForm({ staff, defaultStaff, onCancel, onSave }: { staff: Array<{ id: number; name: string }>; defaultStaff: number; onCancel: () => void; onSave: (staffId: number, on: string) => Promise<void> }) {
  const [staffId, setStaffId] = useState(defaultStaff);
  const [on, setOn] = useState(todayIso());
  const [error, setError] = useState("");
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSave(staffId, on).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save")); }}>
      <Field label="Who agreed it">
        <select className={inputClass} value={staffId} onChange={(event) => setStaffId(Number(event.target.value))}>
          {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </Field>
      <Field label="Date"><UkDateInput value={on} onChange={setOn} /></Field>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="flex gap-2">
        <button className={buttonClass}>Mark let agreed</button>
        <button type="button" className={quietClass} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
