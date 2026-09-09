export const dynamic = "force-dynamic";
import db from "@/lib/db";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter = f === "real" ? 0 : f === "demo" ? 1 : null;
  const all = db.prepare("SELECT * FROM results ORDER BY task_code, id").all() as any[];
  const rows = filter === null ? all : all.filter((r) => r.is_demo === filter);
  const cls = (s: string) => s === "完成" || s === "已提交" ? "s-done" : s === "未接入" ? "s-na" : "s-wait";

  return (
    <>
      <div className="page-title">成果与对照</div>
      <div className="page-sub">H（工程师基准）/ A1（智能体首次）/ C1（人工修正协同）分别保留，C1 不覆盖 A1</div>
      <div className="filter-bar">
        <a href="/results" className={filter === null ? "on" : ""}>全部（{all.length}）</a>
        <a href="/results?f=real" className={filter === 0 ? "on" : ""}>真实（{all.filter((r) => !r.is_demo).length}）</a>
        <a href="/results?f=demo" className={filter === 1 ? "on" : ""}>演示（{all.filter((r) => r.is_demo).length}）</a>
      </div>
      <div className="demo-note">⚠️ 未接入的能力如实显示“未接入”；缺少同题工程师工时时，效率比较显示“待测 / N/A”，不编造节省比例。</div>
      <div className="card">
        <table>
          <thead>
            <tr><th>任务</th><th>成果类别</th><th>版本</th><th>说明</th><th>来源/证据</th><th>状态</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.task_code}</td>
                <td>{r.kind}</td>
                <td className="muted">{r.version || "—"}</td>
                <td className="muted" style={{ maxWidth: 320 }}>{r.summary || "—"}</td>
                <td className="muted" style={{ maxWidth: 240 }}>{r.source_ref || "待核实"}</td>
                <td><span className={`badge ${cls(r.status)}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">
        当前为演示模型结果。真实物性、板片面积、压降、污垢及客户工况仍需工程验证，不能直接作为报价、制造或运行依据。
      </div>
    </>
  );
}
