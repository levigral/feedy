import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, buttonClass, PageTitle, quietClass, useOffice } from "@/components/chrome";
import { ageLabel, feedbackTone, formatUk, isFeedbackComplete, statusLabel } from "@/lib/labels";
import { getBoard, markContacted } from "@/lib/office";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/outstanding")({ component: OutstandingPage });

function OutstandingPage() {
  const { agency, me } = useOffice();
  const [focus, setFocus] = useState<number | null>(null);
  const [board, setBoard] = useState<Awaited<ReturnType<typeof getBoard>> | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (focus != null || !me) return;
    setFocus(me.role === "negotiator" ? me.id : 0);
  }, [me, focus]);

  function load() {
    if (focus == null) return;
    getBoard({ data: { agency, negotiatorId: focus } }).then(setBoard).catch(() => setBoard(null));
  }
  useEffect(load, [agency, focus]);

  const people = board?.staff ?? [];
  const chasing = people.filter((person) => person.outstanding > 0);
  const everyone = people.reduce((sum, person) => sum + person.outstanding, 0);
  const queue = board?.queue ?? [];
  const groups = focus === 0 ? chasing : chasing.filter((person) => person.id === focus);

  return (
    <div>
      <PageTitle title="Outstanding feedback" />
      {note ? <p className="mb-3 text-sm text-good">{note}</p> : null}
      {error ? <p className="mb-3 text-sm text-bad">{error}</p> : null}
      <p className="mb-4 max-w-2xl text-sm text-muted">Each viewing sits with the negotiator who carried it out. Their chased percentage is how many of their viewings have been emailed to the landlord.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`h-11 rounded-full px-4 text-sm ${focus === 0 ? "bg-pine text-pine-ink" : "border border-line bg-card"}`} onClick={() => setFocus(0)}>Everyone · {everyone}</button>
        {chasing.map((person) => {
          const chased = person.viewings ? Math.round((person.done / person.viewings) * 100) : 0;
          return (
            <button key={person.id} type="button" className={`h-11 rounded-full px-4 text-sm ${focus === person.id ? "bg-pine text-pine-ink" : "border border-line bg-card"}`} onClick={() => setFocus(person.id)}>
              {person.name} · {person.outstanding} to chase · {chased}%
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-6">
        {queue.length === 0 ? <p className="text-sm text-muted">No feedback outstanding.</p> : groups.map((person) => {
          const rows = queue.filter((viewing) => viewing.negotiatorId === person.id);
          if (!rows.length) return null;
          const chased = person.viewings ? Math.round((person.done / person.viewings) * 100) : 0;
          return (
            <section key={person.id}>
              <h2 className="font-display text-2xl">{person.name}</h2>
              <p className="text-sm text-muted">{person.outstanding} to chase · {chased}% chased</p>
              <div className="mt-2 grid gap-2">
                {rows.map((viewing) => (
                  <article key={viewing.id} className="rounded-2xl border border-line bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} className="font-medium text-pine">{viewing.address}</Link>
                        <p className="text-sm text-muted">{formatUk(viewing.viewedOn)} {viewing.time} · {viewing.viewerName || "Viewer not named"} · {viewing.days} days</p>
                      </div>
                      <Badge tone={feedbackTone(viewing.status, viewing.days)}>{ageLabel(viewing.days, viewing.status)} · {statusLabel(viewing.status)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} search={{ feedback: viewing.id }} className={buttonClass}>Add feedback</Link>
                      {isFeedbackComplete(viewing.status) ? (
                        <span className="inline-flex h-11 items-center rounded-full bg-good-bg px-4 text-sm text-good">Completed</span>
                      ) : viewing.status === "requested" ? (
                        <span className="inline-flex h-11 items-center rounded-full bg-wait-bg px-4 text-sm text-wait">Contacted</span>
                      ) : (
                        <button type="button" className={quietClass} onClick={() => {
                          void markContacted({ data: { id: viewing.id } })
                            .then(() => { setError(""); setNote("Marked as contacted. It stays outstanding until the landlord email has been sent."); load(); })
                            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not mark contacted"));
                        }}>Mark contacted</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
        {queue.some((viewing) => !viewing.negotiatorId) ? (
          <section>
            <h2 className="font-display text-2xl">Unassigned</h2>
            <div className="mt-2 grid gap-2">
              {queue.filter((viewing) => !viewing.negotiatorId).map((viewing) => (
                <article key={viewing.id} className="rounded-2xl border border-line bg-card p-4">
                  <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} className="font-medium text-pine">{viewing.address}</Link>
                  <p className="text-sm text-muted">{formatUk(viewing.viewedOn)} {viewing.time}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
