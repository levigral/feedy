import { createFileRoute } from "@tanstack/react-router";
import { inputClass, PageTitle, Progress, useOffice } from "@/components/chrome";
import { UkDateInput } from "@/components/uk-date";
import { StaffTable } from "@/components/staff-table";
import { formatUk, statusLabel } from "@/lib/labels";
import { getReports } from "@/lib/office";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

function ReportsPage() {
  const { agency } = useOffice();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<Awaited<ReturnType<typeof getReports>> | null>(null);

  useEffect(() => {
    let live = true;
    getReports({ data: { agency, from, to } }).then((value) => { if (live) setReport(value); }).catch(() => { if (live) setReport(null); });
    return () => { live = false; };
  }, [agency, from, to]);

  return (
    <div>
      <PageTitle title="Reports" />
      <div className="mb-4 flex flex-wrap gap-2">
        <UkDateInput className={inputClass + " max-w-44"} value={from} onChange={setFrom} />
        <UkDateInput className={inputClass + " max-w-44"} value={to} onChange={setTo} />
      </div>
      {report ? (
        <>
          <p className="font-display text-3xl">{report.percent}% emailed to the landlord</p>
          <p className="text-sm text-muted">{report.viewings} viewings in this range</p>
          <div className="mt-3 max-w-md"><Progress value={report.percent} /></div>
          <h2 className="mt-8 font-display text-2xl">By property</h2>
          <ul className="mt-3 grid gap-2">
            {report.byProperty.map((row) => (
              <li key={row.address} className="flex justify-between rounded-xl bg-card px-3 py-2 text-sm">
                <span>{row.address}</span>
                <span className="text-muted">{row.viewings} viewings · {statusLabel(row.status)}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl">Still to let, most viewings</h2>
          <ul className="mt-3 grid gap-2">
            {report.stillAvailable.map((row) => (
              <li key={row.address} className="flex justify-between rounded-xl bg-card px-3 py-2 text-sm"><span>{row.address}</span><span>{row.viewings}</span></li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl">Interested</h2>
          <ul className="mt-3 grid gap-2">
            {report.interested.map((row, index) => (
              <li key={`${row.address}-${index}`} className="rounded-xl bg-card px-3 py-2 text-sm">{row.viewer || "Viewer"} · {row.address} · {formatUk(row.date)} · {statusLabel(row.interest)}</li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl">Why people did not proceed</h2>
          <ul className="mt-3 grid gap-2">
            {report.reasons.length === 0 ? <li className="text-sm text-muted">Nothing recorded yet.</li> : report.reasons.map((row) => (
              <li key={row.reason} className="rounded-xl bg-card px-3 py-2 text-sm">{row.reason} · {row.count}</li>
            ))}
          </ul>
          <h2 className="mt-8 font-display text-2xl">Staff</h2>
          <StaffTable staff={report.staff} />
        </>
      ) : <p className="text-muted">Loading reports…</p>}
    </div>
  );
}
