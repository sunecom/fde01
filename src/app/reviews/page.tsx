export const dynamic = "force-dynamic";
import db from "@/lib/db";

export default function ReviewsPage() {
  const rows = db.prepare("SELECT * FROM reviews ORDER BY id").all() as any[];
  const cls = (s: string) => s === "已确认" ? "s-done" : s === "待确认" ? "s-hold" : "s-wait";
  return (
    <>
      <div className="page-title">待审核事项</div>
      <div className="page-sub">需要谁确认、确认什么、对应成果版本及意见记录</div>
      <div className="card">
        <table>
          <thead>
            <tr><th>事项</th><th>需要确认人</th><th>对应成果版本</th><th>确认内容</th><th>意见记录</th><th>状态</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.item}</td>
                <td>{r.reviewer}</td>
                <td className="muted">{r.result_version || "—"}</td>
                <td className="muted" style={{ maxWidth: 320 }}>{r.question || "—"}</td>
                <td className="muted">{r.opinion || "待记录"}</td>
                <td><span className={`badge ${cls(r.status)}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">
        审核意见先记录。在具备身份核验、版本及成果哈希绑定前，本工作台不宣称支持正式工程签审。
      </div>
    </>
  );
}
