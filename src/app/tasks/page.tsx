export const dynamic = "force-dynamic";
import db from "@/lib/db";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import RecordEditor from "../record-editor";

const STATUSES = ["待资料", "待确认", "排队", "运行", "待审核", "失败", "已提交", "完成"];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const filter = f === "real" ? 0 : f === "demo" ? 1 : null;
  const all = db.prepare("SELECT * FROM tasks ORDER BY id").all() as any[];
  const rows = filter === null ? all : all.filter((t) => t.is_demo === filter);

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isAdmin = session?.role === "admin";

  return (
    <>
      <div className="page-title">任务中心</div>
      <div className="page-sub">任务编号、类型、输入版本、负责人、状态、执行记录、失败原因及下一步</div>
      <div className="filter-bar">
        <a href="/tasks" className={filter === null ? "on" : ""}>全部（{all.length}）</a>
        <a href="/tasks?f=real" className={filter === 0 ? "on" : ""}>真实（{all.filter((t) => !t.is_demo).length}）</a>
        <a href="/tasks?f=demo" className={filter === 1 ? "on" : ""}>演示（{all.filter((t) => t.is_demo).length}）</a>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>编号</th><th>类型</th><th>输入版本</th><th>负责人</th><th>状态</th><th>类别</th><th>执行记录</th><th>失败原因</th><th>下一步</th></tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.code}</td>
                <td>{t.type}</td>
                <td className="muted">{t.input_version || "—"}</td>
                <td>{t.owner}</td>
                <td>{isAdmin ? <RecordEditor table="tasks" id={t.id} field="status" value={t.status} options={STATUSES} /> : t.status}</td>
                <td><span className={`badge ${t.is_demo ? "s-demo" : "s-real"}`}>{t.is_demo ? "演示" : "真实"}</span></td>
                <td className="muted">{t.exec_log || "—"}</td>
                <td className="muted">{t.fail_reason || "—"}</td>
                <td className="muted" style={{ maxWidth: 220 }}>{isAdmin ? <RecordEditor table="tasks" id={t.id} field="next_step" value={t.next_step} /> : (t.next_step || "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">状态含义：待资料 / 待确认 / 排队 / 运行 / 待审核 / 已提交 / 失败 / 完成。执行完成、质量合格与工程批准三个状态分开。</div>
    </>
  );
}
