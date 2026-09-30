export function StaffTable({
  staff,
}: {
  staff: Array<{ id: number; name: string; viewings: number; done: number; outstanding: number; chased?: number; lets: number; avgDays: number | null }>;
}) {
  if (!staff.length) return <p className="mt-2 text-sm text-muted">Staff appear here once a diary names them, or you add them.</p>;
  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-muted md:hidden">Swipe sideways to see the conversion rate.</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Negotiator</th>
              <th className="px-3 py-3 font-medium">Viewings</th>
              <th className="px-3 py-3 font-medium">Emailed</th>
              <th className="px-3 py-3 font-medium">To chase</th>
              <th className="whitespace-nowrap px-3 py-3 font-medium">Chased</th>
              <th className="whitespace-nowrap px-3 py-3 font-medium">Properties let</th>
              <th className="whitespace-nowrap px-3 py-3 font-medium">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((person) => (
              <tr key={person.id} className="border-t border-line">
                <td className="whitespace-nowrap px-3 py-3">{person.name}</td>
                <td className="px-3 py-3">{person.viewings}</td>
                <td className="px-3 py-3">{person.done}</td>
                <td className="px-3 py-3">{person.outstanding}</td>
                <td className="whitespace-nowrap px-3 py-3">{person.chased ?? (person.viewings ? Math.round((person.done / person.viewings) * 100) : 100)}%</td>
                <td className="px-3 py-3">{person.lets}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  {person.viewings ? `${Math.round((person.lets / person.viewings) * 100)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
