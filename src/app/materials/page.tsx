export const dynamic = "force-dynamic";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import RecordEditor from "../record-editor";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter = f === "real" ? 0 : f === "demo" ? 1 : null;
  const all = db.prepare("SELECT * FROM materials ORDER BY id").all() as any[];
  const rows = filter === null ? all : all.filter((m) => m.is_demo === filter);

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isAdmin = session?.role === "admin";

  return (
    <>
      <div className="page-title">需求与资料</div>
      <div className="page-sub">资料清单、提供状态、版本、责任人与缺口说明 · 首版不开放客户原图上传</div>
      <div className="filter-bar">
        <a href="/materials" className={filter === null ? "on" : ""}>全部（{all.length}）</a>
        <a href="/materials?f=real" className={filter === 0 ? "on" : ""}>真实（{all.filter((m) => !m.is_demo).length}）</a>
        <a href="/materials?f=demo" className={filter === 1 ? "on" : ""}>演示（{all.filter((m) => m.is_demo).length}）</a>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>资料项</th><th>类别</th><th>是否提供</th><th>版本</th><th>责任人</th><th>缺口说明</th></tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td><span className={`badge ${m.is_demo ? "s-demo" : "s-real"}`}>{m.is_demo ? "演示" : "真实"}</span></td>
                <td>
                  {isAdmin ? <RecordEditor table="materials" id={m.id} field="provided" value={m.provided} options={["0", "1"]} /> :
                    <span className={`badge ${m.provided ? "s-done" : "s-hold"}`}>{m.provided ? "已提供" : "未提供"}</span>}
                </td>
                <td className="muted">{isAdmin ? <RecordEditor table="materials" id={m.id} field="version" value={m.version} /> : (m.version || "—")}</td>
                <td>{m.owner || "—"}</td>
                <td className="muted" style={{ maxWidth: 360 }}>{m.gap_note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">客户原图、模型、私有规则、计算书与详细工程日志默认保留在本地工程环境，不上传云端工作台。{isAdmin ? "管理员可点 ✎ 编辑。" : ""}</div>
    </>
  );
}
