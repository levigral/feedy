import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, buttonClass, Field, inputClass, Modal, PageTitle, quietClass, useOffice } from "@/components/chrome";
import { emptyProperty } from "@/components/property-form";
import { agencyFromFilename, parseDiaryMatrix, type DraftViewing } from "@/lib/diary";
import { matrixFromFile } from "@/lib/diary-file";
import { UkDateInput } from "@/components/uk-date";
import { ageLabel, feedbackTone, formatUk, statusLabel, todayIso } from "@/lib/labels";
import { addViewing, deleteViewing, importDiary, listProperties, listStaff, listViewings, saveProperty } from "@/lib/office";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/viewings")({ component: ViewingsPage });

type FileDraft = { name: string; agency: "" | "al" | "gr"; rows: DraftViewing[]; error: string };
type ImportSummary = Awaited<ReturnType<typeof importDiary>>;
type LetMatch = ImportSummary["letAgreed"][number];

function diaryRow(row: DraftViewing, agency: string) {
  return {
    staffName: row.staffName,
    date: row.date,
    time: row.time,
    address: row.address,
    viewerName: row.viewerName,
    viewerPhone: row.viewerPhone,
    viewerEmail: row.viewerEmail,
    notes: row.notes,
    agency,
    event: row.event || "Viewing",
    landlordName: row.landlordName,
    landlordEmail: row.landlordEmail,
    landlordName2: row.landlordName2,
    landlordEmail2: row.landlordEmail2,
  };
}

function ViewingsPage() {
  const { agency, me } = useOffice();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listViewings>>>([]);
  const [files, setFiles] = useState<FileDraft[]>([]);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [letAgreed, setLetAgreed] = useState<LetMatch[]>([]);

  function rememberMatches(found: LetMatch[]) {
    if (!found.length) return;
    setLetAgreed((current) => {
      const next = current.map((item) => ({ ...item, rows: [...item.rows] }));
      for (const item of found) {
        const existing = next.find((entry) => entry.propertyId === item.propertyId);
        if (existing) existing.rows.push(...item.rows);
        else next.push(item);
      }
      return next;
    });
  }

  function summaryText(summary: ImportSummary, fileName?: string) {
    const names = summary.createdStaff.length ? ` New staff: ${summary.createdStaff.join(", ")}.` : "";
    const ask = summary.letAgreed.length ? ` ${summary.letAgreed.length} already let agreed — choose whether to keep the old landlord details.` : "";
    const lead = fileName ? `${fileName}: ` : "";
    return `${lead}${summary.createdViewings} viewings added, ${summary.createdProperties} new properties. Addresses already on the system were not added again.${names}${ask}`;
  }

  function load() {
    listViewings({ data: {} }).then(setRows).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load viewings"));
  }
  useEffect(load, []);
  useEffect(() => {
    if (window.location.hash === "#add") setAdding(true);
  }, []);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setResult("");
    const next: FileDraft[] = [];
    for (const file of Array.from(list)) {
      try {
        const matrix = await matrixFromFile(file);
        const parsed = parseDiaryMatrix(matrix);
        const fileAgency = agencyFromFilename(file.name) || (agency === "gr" || agency === "al" ? agency : "");
        const ready = parsed.filter((row) => row.keep && row.address.trim() && fileAgency);
        const held = fileAgency ? parsed.filter((row) => !row.keep) : parsed;
        if (ready.length) {
          const summary = await importDiary({
            data: { rows: ready.map((row) => diaryRow(row, fileAgency)) },
          });
          rememberMatches(summary.letAgreed);
          setResult((current) => `${current ? `${current} ` : ""}${summaryText(summary, file.name)} Other appointments were ignored.`);
          load();
        }
        if (!parsed.length) {
          next.push({
            name: file.name,
            agency: fileAgency,
            rows: [],
            error: "No viewing appointments were found. Only lines with the word viewing are used.",
          });
        } else if (held.length) {
          next.push({
            name: file.name,
            agency: fileAgency,
            rows: held,
            error: fileAgency
              ? "Add the property address on each row, then create them. New negotiators are added to staff."
              : "Choose the agency and add the property address. New negotiators are added to staff.",
          });
        }
      } catch (err) {
        next.push({ name: file.name, agency: "", rows: [], error: err instanceof Error ? err.message : "Could not read that diary" });
      }
    }
    setFiles((current) => [...next, ...current]);
  }

  function update(fileIndex: number, rowIndex: number, patch: Partial<DraftViewing>) {
    setFiles((current) => current.map((file, index) => index === fileIndex ? { ...file, rows: file.rows.map((row, inner) => inner === rowIndex ? { ...row, ...patch } : row) } : file));
  }

  async function confirm() {
    const chosen = files.flatMap((file) => file.rows.filter((row) => row.keep).map((row) => ({ ...row, agency: file.agency })));
    if (!chosen.length) { setError("Tick the viewing rows you want, and choose an agency for each file."); return; }
    if (chosen.some((row) => row.agency !== "al" && row.agency !== "gr")) { setError("Choose Andrew Lees or Gibbins Richards for each diary."); return; }
    if (chosen.some((row) => !row.date || !row.staffName || !row.address.trim())) { setError("Each ticked row needs a staff name, a date and a property address."); return; }
    setBusy(true);
    setError("");
    try {
      const summary = await importDiary({
        data: { rows: chosen.map((row) => diaryRow(row, row.agency)) },
      });
      rememberMatches(summary.letAgreed);
      setResult(summaryText(summary));
      setFiles([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function decideLetAgreed(match: LetMatch, reuse: boolean) {
    setBusy(true);
    setError("");
    try {
      const summary = await importDiary({
        data: {
          rows: match.rows.map((row, index) => ({
            ...row,
            reuseId: reuse ? match.propertyId : undefined,
            forceNew: reuse || index > 0 ? undefined : true,
          })),
        },
      });
      setLetAgreed((current) => current.filter((item) => item.propertyId !== match.propertyId));
      rememberMatches(summary.letAgreed);
      setResult(reuse
        ? `${match.address} is back on the market with the previous landlord details. ${summary.createdViewings} viewings added.`
        : `${match.address} was added as a new property so you can enter the new landlord. ${summary.createdViewings} viewings added.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that choice");
    } finally {
      setBusy(false);
    }
  }

  const visible = rows.filter((row) => agency === "all" || row.agency === agency);

  return (
    <div>
      <PageTitle title="Viewings" action={<button type="button" className={buttonClass} onClick={() => setAdding(true)}>Add viewing</button>} />
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="font-display text-2xl">Import a diary</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Drop a diary, or a CSV with staff_member, appointment_date and appointment_time. Appointments that say viewing are kept. An address already on the system is not added again. If it was let agreed, you can keep the old landlord details or start a new property.
        </p>
        <label className="mt-4 grid min-h-28 cursor-pointer place-items-center rounded-2xl border border-dashed border-line bg-paper text-center">
          <span className="px-4 py-6 text-sm">Drop PDF, Excel or CSV diaries here, or click to choose</span>
          <input className="sr-only" type="file" accept=".pdf,.csv,.tsv,.txt,.xlsx,.xls" multiple onChange={(event) => { void onFiles(event.target.files); event.target.value = ""; }} />
        </label>
        {files.map((file, fileIndex) => (
          <div key={`${file.name}-${fileIndex}`} className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{file.name}</p>
              <select className={inputClass + " max-w-xs"} value={file.agency} onChange={(event) => setFiles((current) => current.map((item, index) => index === fileIndex ? { ...item, agency: event.target.value as FileDraft["agency"] } : item))}>
                <option value="">Choose agency</option>
                <option value="al">Andrew Lees Lettings</option>
                <option value="gr">Gibbins Richards Lettings</option>
              </select>
            </div>
            {file.error ? <p className="mt-2 text-sm text-bad">{file.error}</p> : null}
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="py-2 pr-2">Use</th>
                    <th className="py-2 pr-2">Staff</th>
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2">Event</th>
                    <th className="py-2">Property</th>
                  </tr>
                </thead>
                <tbody>
                  {file.rows.map((row, rowIndex) => (
                    <tr key={`${row.id}-${rowIndex}`} className="border-t border-line align-top">
                      <td className="py-2 pr-2"><input type="checkbox" className="mt-3 size-5" checked={row.keep} onChange={(event) => update(fileIndex, rowIndex, { keep: event.target.checked })} /></td>
                      <td className="py-2 pr-2"><input className={inputClass} value={row.staffName} onChange={(event) => update(fileIndex, rowIndex, { staffName: event.target.value })} /></td>
                      <td className="py-2 pr-2">
                        <UkDateInput value={row.date} onChange={(date) => update(fileIndex, rowIndex, { date })} />
                        {!row.date && row.rawDate ? <p className="mt-1 text-xs text-bad">Diary said {row.rawDate}</p> : null}
                        {!row.date ? <p className="mt-1 text-xs text-bad">Date not read</p> : <p className="mt-1 text-xs text-muted">{formatUk(row.date)}</p>}
                      </td>
                      <td className="py-2 pr-2"><input className={inputClass} value={row.time} onChange={(event) => update(fileIndex, rowIndex, { time: event.target.value })} /></td>
                      <td className="py-2 pr-2">
                        <p>{row.event || "—"}</p>
                        {row.issue ? <p className="text-xs text-bad">{row.issue}</p> : null}
                      </td>
                      <td className="py-2"><input className={inputClass} value={row.address} placeholder="Property address" onChange={(event) => update(fileIndex, rowIndex, { address: event.target.value })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {files.length ? <button type="button" className={`${buttonClass} mt-4`} disabled={busy} onClick={() => void confirm()}>{busy ? "Saving…" : "Create properties and viewings"}</button> : null}
        {result ? <p className="mt-3 text-sm text-good">{result}</p> : null}
        {letAgreed.map((match) => {
          const previous = [match.landlordName, match.landlordEmail, match.landlordName2, match.landlordEmail2].filter((item) => item && item !== "To be added");
          return (
            <article key={match.propertyId} className="mt-4 rounded-2xl border border-line bg-paper p-4">
              <h3 className="font-medium">{match.address} is already let agreed</h3>
              <p className="mt-1 text-sm text-muted">
                {match.rows.length} viewing{match.rows.length === 1 ? "" : "s"} in this diary.
                {previous.length ? ` Previous landlord: ${previous.join(" · ")}.` : " No landlord details were saved last time."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={buttonClass} disabled={busy} onClick={() => void decideLetAgreed(match, true)}>Use previous landlord details</button>
                <button type="button" className={quietClass} disabled={busy} onClick={() => void decideLetAgreed(match, false)}>New property, new landlord</button>
              </div>
            </article>
          );
        })}
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      </section>
      {adding ? (
        <ManualViewing
          agency={agency === "gr" ? "gr" : "al"}
          defaultStaff={me?.id ?? 0}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); load(); }}
        />
      ) : null}
      <h2 className="mt-8 font-display text-2xl">On the book</h2>
      <div className="mt-3 grid gap-2">
        {visible.length === 0 ? <p className="text-sm text-muted">No viewings yet.</p> : visible.map((viewing) => (
          <article key={viewing.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{viewing.address}</p>
                <p className="text-sm text-muted">{viewing.negotiatorName || "Unassigned"} · {formatUk(viewing.viewedOn)} {viewing.time} · {viewing.viewerName || "Viewer not named"}</p>
              </div>
              <Badge tone={feedbackTone(viewing.status, viewing.days)}>{ageLabel(viewing.days, viewing.status)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} className={quietClass}>View property</Link>
              {me?.role === "admin" ? (
                confirmId === viewing.id ? (
                  <button
                    type="button"
                    className={quietClass}
                    onClick={() => {
                      setRows((current) => current.filter((row) => row.id !== viewing.id));
                      setConfirmId(null);
                      deleteViewing({ data: { id: viewing.id } })
                        .then(() => load())
                        .catch((err: unknown) => {
                          setError(err instanceof Error ? err.message : "Could not delete that viewing");
                          load();
                        });
                    }}
                  >
                    Confirm delete
                  </button>
                ) : (
                  <button type="button" className={quietClass} onClick={() => setConfirmId(viewing.id)}>Delete</button>
                )
              ) : null}
              <span className="self-center text-sm text-muted">{statusLabel(viewing.status)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ManualViewing({
  agency,
  defaultStaff,
  onClose,
  onSaved,
}: {
  agency: "al" | "gr";
  defaultStaff: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [properties, setProperties] = useState<Awaited<ReturnType<typeof listProperties>>>([]);
  const [staff, setStaff] = useState<Awaited<ReturnType<typeof listStaff>>>([]);
  const [filter, setFilter] = useState("");
  const [propertyId, setPropertyId] = useState(0);
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyAgency, setPropertyAgency] = useState<"al" | "gr">(agency);
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [viewerPhone, setViewerPhone] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [negotiatorId, setNegotiatorId] = useState(defaultStaff);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listProperties().then(setProperties).catch(() => setProperties([]));
    listStaff().then((people) => {
      setStaff(people);
      if (!defaultStaff && people[0]) setNegotiatorId(people[0].id);
    }).catch(() => setStaff([]));
  }, [defaultStaff]);

  const choices = properties.filter((row) => {
    const hay = `${row.address} ${row.postcode}`.toLowerCase();
    return hay.includes(filter.toLowerCase());
  });

  async function save() {
    setBusy(true);
    setError("");
    try {
      let id = propertyId;
      if (!id) {
        const line = address.trim();
        if (!line) throw new Error("Choose a property, or type the address of a new one.");
        const created = await saveProperty({ data: { ...emptyProperty, address: line, postcode, agency: propertyAgency } });
        id = created.id;
      }
      await addViewing({
        data: { propertyId: id, date, time, viewerName, viewerPhone, viewerEmail, negotiatorId, notes, immediate: false },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <Modal title="Add viewing" onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <Field label="Find a property">
          <input className={inputClass} value={filter} placeholder="Search address" onChange={(event) => setFilter(event.target.value)} />
        </Field>
        <Field label="Property">
          <select className={inputClass} value={propertyId} onChange={(event) => setPropertyId(Number(event.target.value))}>
            <option value={0}>New property — type the address below</option>
            {choices.map((row) => (
              <option key={row.id} value={row.id}>{row.address}{row.postcode ? `, ${row.postcode}` : ""}</option>
            ))}
          </select>
        </Field>
        {propertyId === 0 ? (
          <>
            <Field label="New address"><input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} required /></Field>
            <Field label="Postcode"><input className={inputClass} value={postcode} onChange={(event) => setPostcode(event.target.value)} /></Field>
            <Field label="Agency">
              <select className={inputClass} value={propertyAgency} onChange={(event) => setPropertyAgency(event.target.value === "gr" ? "gr" : "al")}>
                <option value="al">Andrew Lees Lettings</option>
                <option value="gr">Gibbins Richards Lettings</option>
              </select>
            </Field>
          </>
        ) : null}
        <Field label="Date"><UkDateInput value={date} onChange={setDate} required /></Field>
        <Field label="Time"><input className={inputClass} value={time} onChange={(event) => setTime(event.target.value)} placeholder="10:30" /></Field>
        <Field label="Viewer"><input className={inputClass} value={viewerName} onChange={(event) => setViewerName(event.target.value)} /></Field>
        <Field label="Viewer phone"><input className={inputClass} value={viewerPhone} onChange={(event) => setViewerPhone(event.target.value)} /></Field>
        <Field label="Viewer email"><input className={inputClass} value={viewerEmail} onChange={(event) => setViewerEmail(event.target.value)} /></Field>
        <Field label="Negotiator">
          <select className={inputClass} value={negotiatorId} onChange={(event) => setNegotiatorId(Number(event.target.value))}>
            <option value={0}>Not assigned</option>
            {staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea className="min-h-20 w-full rounded-xl border border-line p-3" value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <button type="submit" className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save viewing"}</button>
      </form>
    </Modal>
  );
}
