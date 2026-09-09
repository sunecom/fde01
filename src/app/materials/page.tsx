export const dynamic = "force-dynamic";
import db from "@/lib/db";

export default function MaterialsPage() {
  const rows = db.prepare("SELECT * FROM materials ORDER BY id").all() as any[];
  return (
    <>
      <div className="page-title">需求与资料</div>
      <div className="page-sub">资料清单、提供状态、版本、责任人与缺口说明 · 首版不开放客户原图上传</div>
      <div className="card">
        <table>
          <thead>
            <tr><th>资料项</th><th>是否提供</th><th>版本</th><th>责任人</th><th>缺口说明</th></tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>
                  <span className={`badge ${m.provided ? "s-done" : "s-hold"}`}>{m.provided ? "已提供" : "未提供"}</span>
                </td>
                <td className="muted">{m.version || "—"}</td>
                <td>{m.owner || "—"}</td>
                <td className="muted" style={{ maxWidth: 360 }}>{m.gap_note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">客户原图、模型、私有规则、计算书与详细工程日志默认保留在本地工程环境，不上传云端工作台。</div>
    </>
  );
}
