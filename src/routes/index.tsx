import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, buttonClass, Empty, PageTitle, Progress, quietClass, useOffice } from "@/components/chrome";
import { StaffTable } from "@/components/staff-table";
import { ageLabel, feedbackTone, formatUk, isFeedbackComplete, statusLabel } from "@/lib/labels";
import { getBoard, markApplication } from "@/lib/office";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    let live = true;
    getBoard({ data: { agency, range, negotiatorId } })
      .then((value) => { if (live) setBoard(value); })
      .catch((err: unknown) => { if (live) setError(err instanceof Error ? err.message : "Could not load the dashboard"); });
    return () => { live = false; };
  }, [agency, range, negotiatorId, tick]);

  const waiting = (board?.matched ?? []).filter((row) => !isFeedbackComplete(row.status));
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
        {cards.map((card) =>
          card.key === "properties" ? (
            <Link key={card.key} to="/properties" className="rounded-2xl border border-line bg-card p-4 hover:border-pine">
              <p className="text-sm text-muted">{card.label}</p>
              <p className="font-display text-3xl">{card.value}</p>
              <p className="mt-1 text-xs text-pine">Open properties</p>
            </Link>
          ) : (
            <button key={card.key} type="button" className={`rounded-2xl border p-4 text-left ${open === card.key ? "border-pine bg-card" : "border-line bg-card"}`} onClick={() => setOpen((current) => current === card.key ? "" : card.key)}>
              <p className="text-sm text-muted">{card.label}</p>
              <p className="font-display text-3xl">{card.value}</p>
              <p className="mt-1 text-xs text-pine">{open === card.key ? "Hide" : "Open"}</p>
            </button>
          ),
        )}
      </div>
      {open === "viewings" ? <Drill title="Viewings" rows={board?.matched ?? []} /> : null}
      {open === "done" ? <Drill title="Emailed to the landlord" rows={board?.doneQueue ?? []} showFeedback /> : null}
      {open === "outstanding" ? <Drill title="Outstanding" rows={waiting} /> : null}
      {open === "interested" ? <Drill title="Interested, still to follow up" rows={board?.interestedQueue ?? []} showFeedback /> : null}
      {open === "applications" ? <Drill title="Applications sent to the landlord" rows={board?.applicationQueue ?? []} showFeedback /> : null}
      {open === "completion" ? (
        <section className="mt-3 rounded-2xl border border-line bg-card p-4">
          <p className="font-medium">{board?.percent ?? 0}% of viewings in this period have been emailed to the landlord.</p>
          <Drill title="Still outstanding" rows={waiting} bare />
          <Drill title="Feedback already emailed" rows={board?.doneQueue ?? []} showFeedback bare />
        </section>
      ) : null}
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
      <p className="mt-1 max-w-2xl text-sm text-muted">These viewers are no longer pending. The application has gone across.</p>
      <InterestList
        rows={board?.applicationQueue ?? []}
        empty="No applications sent yet."
        action="Move back to interested"
        onAction={(id) => {
          markApplication({ data: { id, across: false } })
            .then(() => { setNote("Moved back to interested viewers."); setTick((value) => value + 1); })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update"));
        }}
      />
      <h2 className="mt-8 font-display text-2xl">Viewings per let</h2>
      <StaffTable staff={board?.staff ?? []} />
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