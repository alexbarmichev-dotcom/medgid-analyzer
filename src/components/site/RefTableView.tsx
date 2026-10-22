const RefTableView = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="overflow-x-auto rounded-2xl border border-border bg-card">
    <table className="w-full text-left text-[0.95rem]">
      <thead className="bg-hand/10 text-foreground">
        <tr>
          {head.map((c) => (
            <th key={c} className="px-4 py-3 font-semibold">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-border">
            {r.map((c, j) => (
              <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium text-foreground' : ''}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RefTableView;
