export const dynamic = "force-dynamic";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import RecordEditor from "../record-editor";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter = f === "real" ? 0 : f === "demo" ? 1 : null;
  const all = db.prepare("SELECT * FROM reviews ORDER BY id").all() as any[];
  const rows = filter === null ? all : all.filter((r) => r.is_demo === filter);

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isAdmin = session?.role === "admin";

  return (
    <>
      <div className="page-title">待审核事项</div>
      <div className="page-sub">需要谁确认、确认什么、对应成果版本及意见记录</div>
      <div className="filter-bar">
        <a href="/reviews" className={filter === null ? "on" : ""}>全部（{all.length}）</a>
        <a href="/reviews?f=real" className={filter === 0 ? "on" : ""}>真实（{all.filter((r) => !r.is_demo).length}）</a>
        <a href="/reviews?f=demo" className={filter === 1 ? "on" : ""}>演示（{all.filter((r) => r.is_demo).length}）</a>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>事项</th><th>类别</th><th>需要确认人</th><th>对应成果版本</th><th>确认内容</th><th>意见记录</th><th>状态</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.item}</td>
                <td><span className={`badge ${r.is_demo ? "s-demo" : "s-real"}`}>{r.is_demo ? "演示" : "真实"}</span></td>
                <td>{r.reviewer}</td>
                <td className="muted">{r.result_version || "—"}</td>
                <td className="muted" style={{ maxWidth: 260 }}>{r.question || "—"}</td>
                <td style={{ maxWidth: 220 }}>{isAdmin ? <RecordEditor table="reviews" id={r.id} field="opinion" value={r.opinion} textarea /> : (r.opinion || "待记录")}</td>
                <td>{isAdmin ? <RecordEditor table="reviews" id={r.id} field="status" value={r.status} options={["待确认", "已确认"]} /> : r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">
        审核意见先记录（管理员可编辑）。在具备身份核验、版本及成果哈希绑定前，本工作台不宣称支持正式工程签审。
      </div>
    </>
  );
}
