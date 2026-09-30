import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, buttonClass, Empty, PageTitle, Progress, quietClass, useOffice } from "@/components/chrome";
import { StaffTable } from "@/components/staff-table";
import { ageLabel, feedbackTone, formatUk, isFeedbackComplete, statusLabel } from "@/lib/labels";
import { getBoard, decideApplication, markApplication } from "@/lib/office";
import { Fragment, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: Dashboard });

type Board = Awaited<ReturnType<typeof getBoard>>;
type Viewing = Board["matched"][number];

function Dashboard() {
  const { agency } = useOffice();
  const [range, setRange] = useState("all");
  const [negotiatorId, setNegotiatorId] = useState(0);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState("");
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    getBoard({ data: { agency, range, negotiatorId } })
      .then((value) => { if (live) setBoard(value); })
      .catch((err: unknown) => { if (live) setError(err instanceof Error ? err.message : "Could not load the dashboard"); });
    return () => { live = false; };
  }, [agency, range, negotiatorId, tick]);

  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open]);

  const waiting = (board?.matched ?? []).filter((row) => !isFeedbackComplete(row.status));
  function decide(id: number, decision: "accepted" | "declined") {
    decideApplication({ data: { id, decision } })
      .then(() => {
        setNote(decision === "accepted" ? "Accepted. That property is now let agreed." : "Declined and removed from applications.");
        setTick((value) => value + 1);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update"));
  }
  const cards = board
    ? [
        { key: "properties", label: "Active properties", value: String(board.activeProperties) },
        { key: "viewings", label: "Viewings", value: String(board.viewings) },
        { key: "done", label: "Emailed", value: String(board.done) },
        { key: "outstanding", label: "Outstanding", value: String(board.outstanding) },
        { key: "completion", label: "Completion", value: `${board.percent}%` },
        { key: "interested", label: "Interested", value: String(board.interested) },
        { key: "applications", label: "Applications", value: String(board.applications) },
      ]
    : [];

  function cardPanel(key: string) {
    if (key === "viewings") return <Drill title="Viewings" rows={board?.matched ?? []} />;
    if (key === "done") return <Drill title="Emailed to the landlord" rows={board?.doneQueue ?? []} showFeedback />;
    if (key === "outstanding") return <Drill title="Outstanding" rows={waiting} />;
    if (key === "interested") return <Drill title="Interested, still to follow up" rows={board?.interestedQueue ?? []} showFeedback />;
    if (key === "applications") {
      return (
        <section className="rounded-2xl border border-line bg-card p-4">
          <h3 className="mb-3 font-display text-2xl">Applications sent to the landlord</h3>
          <ApplicationList rows={board?.applicationQueue ?? []} onDecide={decide} />
        </section>
      );
    }
    if (key === "completion") {
      return (
        <section className="rounded-2xl border border-line bg-card p-4">
          <p className="font-medium">{board?.percent ?? 100}% of viewings from before today have been emailed to the landlord. Today and later are left out until the next day.</p>
          <Drill title="Still outstanding" rows={waiting} bare />
          <Drill title="Feedback already emailed" rows={board?.doneQueue ?? []} showFeedback bare />
        </section>
      );
    }
    return null;
  }

  return (
    <div>
      <PageTitle
        title="Dashboard"
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/properties" hash="add" className={quietClass}>Add property</Link>
            <Link to="/viewings" hash="add" className={buttonClass}>Add viewing</Link>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "today", "week", "month"].map((item) => (
          <button key={item} type="button" className={`h-11 rounded-full px-4 text-sm ${range === item ? "bg-pine text-pine-ink" : "bg-card border border-line"}`} onClick={() => setRange(item)}>
            {item === "all" ? "All" : item === "today" ? "Today" : item === "week" ? "This week" : "This month"}
          </button>
        ))}
        <select className="h-11 rounded-full border border-line bg-card px-3" value={negotiatorId} onChange={(event) => setNegotiatorId(Number(event.target.value))}>
          <option value={0}>Everyone</option>
          {board?.staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </div>
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-good">{note}</p> : null}
      {board?.attention ? (
        <Link to="/outstanding" className="mb-4 flex items-center justify-between rounded-2xl bg-bad-bg px-4 py-3 text-bad">
          <span>{board.attention} viewing feedbacks need attention</span>
          <span>Open the list</span>
        </Link>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Fragment key={card.key}>
            {card.key === "properties" ? (
              <Link to="/properties" className="rounded-2xl border border-line bg-card p-4 hover:border-pine">
                <p className="text-sm text-muted">{card.label}</p>
                <p className="font-display text-3xl">{card.value}</p>
                <p className="mt-1 text-xs text-pine">Open properties</p>
              </Link>
            ) : (
              <button type="button" className={`rounded-2xl border p-4 text-left ${open === card.key ? "border-pine bg-card" : "border-line bg-card"}`} onClick={() => setOpen((current) => current === card.key ? "" : card.key)}>
                <p className="text-sm text-muted">{card.label}</p>
                <p className="font-display text-3xl">{card.value}</p>
                <p className="mt-1 text-xs text-pine">{open === card.key ? "Hide" : "Open"}</p>
              </button>
            )}
            {open === card.key ? <div className="col-span-full" ref={panelRef}>{cardPanel(card.key)}</div> : null}
          </Fragment>
        ))}
      </div>
      {board ? <div className="mt-3"><Progress value={board.percent} /></div> : null}
      <h2 className="mt-8 font-display text-2xl">Outstanding feedback</h2>
      {!board ? <p className="mt-3 text-muted">Loading…</p> : board.queue.length === 0 ? (
        <div className="mt-3"><Empty title="Nothing waiting" body="Drop a diary on Viewings. Each viewing stays here until feedback is in." /></div>
      ) : (
        <div className="mt-3 grid gap-2">
          {board.queue.slice(0, 8).map((viewing) => (
            <Link key={viewing.id} to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} search={{ feedback: viewing.id }} className="grid gap-1 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium">{viewing.address}</p>
                <p className="text-sm text-muted">{viewing.negotiatorName || "Unassigned"} · {formatUk(viewing.viewedOn)} {viewing.time} · {viewing.viewerName || "Viewer not named"}</p>
              </div>
              <Badge tone={feedbackTone(viewing.status, viewing.days)}>{ageLabel(viewing.days, viewing.status)} · {statusLabel(viewing.status)}</Badge>
            </Link>
          ))}
        </div>
      )}
      <h2 className="mt-8 font-display text-2xl">Interested viewers</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">Anyone who said they are interested or very interested stays here until the negotiator sends an application to the landlord.</p>
      <InterestList
        rows={board?.interestedQueue ?? []}
        empty="Nobody waiting. They appear here after feedback is marked interested or very interested."
        action="Application sent to landlord"
        onAction={(id) => {
          markApplication({ data: { id, across: true } })
            .then(() => { setNote("Moved to applications sent to the landlord."); setTick((value) => value + 1); })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update"));
        }}
      />
      <h2 className="mt-8 font-display text-2xl">Applications sent to the landlord</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">Accept marks the property let agreed. Decline removes that application from this list.</p>
      <ApplicationList rows={board?.applicationQueue ?? []} onDecide={decide} />
      <h2 className="mt-8 font-display text-2xl">Accepted applications</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">These marked the property let agreed. Undo puts the application back on the list and takes the property off let agreed.</p>
      <InterestList
        rows={board?.acceptedQueue ?? []}
        empty="No accepted applications."
        action="Undo accept"
        onAction={(id) => {
          decideApplication({ data: { id, decision: "undo" } })
            .then(() => { setNote("Accept undone. The application is back on the list and the property is no longer let agreed."); setTick((value) => value + 1); })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update"));
        }}
      />
      <h2 className="mt-8 font-display text-2xl">Declined applications</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">Undo puts them back on the applications list, so you can accept or decline again.</p>
      <InterestList
        rows={board?.declinedQueue ?? []}
        empty="No declined applications."
        action="Undo decline"
        onAction={(id) => {
          decideApplication({ data: { id, decision: "undo" } })
            .then(() => { setNote("Put back on applications."); setTick((value) => value + 1); })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update"));
        }}
      />
      <h2 className="mt-8 font-display text-2xl">Viewings per let</h2>
      <StaffTable staff={board?.staff ?? []} />
    </div>
  );
}

function ApplicationList({
  rows,
  onDecide,
}: {
  rows: Viewing[];
  onDecide: (id: number, decision: "accepted" | "declined") => void;
}) {
  if (rows.length === 0) return <p className="mt-3 text-sm text-muted">No applications sent yet.</p>;
  return (
    <div className="mt-3 grid gap-2">
      {rows.map((viewing) => (
        <article key={viewing.id} className="grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-medium">{viewing.viewerName || "Viewer not named"} · {statusLabel(viewing.interest)}</p>
            <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} className="text-pine">{viewing.address}</Link>
            <p className="text-sm text-muted">{viewing.negotiatorName || "Unassigned"} · {formatUk(viewing.viewedOn)} {viewing.time}</p>
            {viewing.feedbackText ? <p className="mt-2 text-sm">{viewing.feedbackText}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => onDecide(viewing.id, "accepted")}>Accepted</button>
            <button type="button" className={quietClass} onClick={() => onDecide(viewing.id, "declined")}>Declined</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function InterestList({
  rows,
  empty,
  action,
  onAction,
}: {
  rows: Viewing[];
  empty: string;
  action: string;
  onAction: (id: number) => void;
}) {
  if (rows.length === 0) return <p className="mt-3 text-sm text-muted">{empty}</p>;
  return (
    <div className="mt-3 grid gap-2">
      {rows.map((viewing) => (
        <article key={viewing.id} className="grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-medium">{viewing.viewerName || "Viewer not named"} · {statusLabel(viewing.interest)}</p>
            <Link to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} className="text-pine">{viewing.address}</Link>
            <p className="text-sm text-muted">{viewing.negotiatorName || "Unassigned"} · {formatUk(viewing.viewedOn)} {viewing.time}</p>
            {viewing.feedbackText ? <p className="mt-2 text-sm">{viewing.feedbackText}</p> : null}
          </div>
          <button type="button" className={quietClass} onClick={() => onAction(viewing.id)}>{action}</button>
        </article>
      ))}
    </div>
  );
}

function Drill({ title, rows, showFeedback, bare }: { title: string; rows: Viewing[]; showFeedback?: boolean; bare?: boolean }) {
  const body = rows.length === 0 ? (
    <p className="text-sm text-muted">Nothing in this list.</p>
  ) : (
    <div className="grid gap-2">
      {rows.map((viewing) => (
        <Link key={viewing.id} to="/properties/$propertyId" params={{ propertyId: String(viewing.propertyId) }} search={showFeedback ? {} : { feedback: viewing.id }} className="rounded-2xl border border-line bg-paper p-3">
          <p className="font-medium">{viewing.address}</p>
          <p className="text-sm text-muted">{viewing.negotiatorName || "Unassigned"} · {formatUk(viewing.viewedOn)} {viewing.time} · {viewing.viewerName || "Viewer not named"}</p>
          {showFeedback && viewing.feedbackText ? <p className="mt-2 text-sm">{viewing.feedbackText}</p> : null}
        </Link>
      ))}
    </div>
  );
  if (bare) {
    return (
      <div className="mt-4">
        <h3 className="mb-2 font-medium">{title}</h3>
        {body}
      </div>
    );
  }
  return (
    <section className="mt-3 rounded-2xl border border-line bg-card p-4">
      <h3 className="mb-3 font-display text-2xl">{title}</h3>
      {body}
    </section>
  );
}