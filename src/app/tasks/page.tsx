export const dynamic = "force-dynamic";
import db from "@/lib/db";

export default function TasksPage() {
  const rows = db.prepare("SELECT * FROM tasks ORDER BY id").all() as any[];
  const cls = (s: string) => s === "完成" ? "s-done" : s === "运行" ? "s-run" : s === "失败" ? "s-fail" : ["排队", "待审核"].includes(s) ? "s-wait" : "s-hold";
  return (
    <>
      <div className="page-title">任务中心</div>
      <div className="page-sub">任务编号、类型、输入版本、负责人、状态、执行记录、失败原因及下一步</div>
      <div className="demo-note">⚠️ 以下任务为演示记录，仅 FDE-WEB-01 为真实执行任务。</div>
      <div className="card">
        <table>
          <thead>
            <tr><th>编号</th><th>类型</th><th>输入版本</th><th>负责人</th><th>状态</th><th>执行记录</th><th>失败原因</th><th>下一步</th></tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.code}</td>
                <td>{t.type}</td>
                <td className="muted">{t.input_version || "—"}</td>
                <td>{t.owner}</td>
                <td><span className={`badge ${cls(t.status)}`}>{t.status}</span></td>
                <td className="muted">{t.exec_log || "—"}</td>
                <td className="muted">{t.fail_reason || "—"}</td>
                <td className="muted" style={{ maxWidth: 260 }}>{t.next_step || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sim-note">状态含义：待资料 / 待确认 / 排队 / 运行 / 待审核 / 失败 / 完成。执行状态、质量检查与工程批准分别展示，不混用。</div>
    </>
  );
}
