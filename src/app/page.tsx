export const dynamic = "force-dynamic";
import db from "@/lib/db";

function statusBadge(s: string) {
  const cls = s === "完成" ? "s-done" : s === "运行" ? "s-run" : s === "失败" ? "s-fail" : "s-hold";
  return <span className={`badge ${cls}`}>{s}</span>;
}

export default function Home() {
  const tasks = db.prepare("SELECT * FROM tasks").all() as any[];
  const materials = db.prepare("SELECT * FROM materials").all() as any[];
  const reviews = db.prepare("SELECT * FROM reviews WHERE status != ?").all("已确认") as any[];
  const holdCount = tasks.filter((t) => ["待资料", "待确认"].includes(t.status)).length;

  return (
    <>
      <div className="page-title">项目总览</div>
      <div className="page-sub">FDE · 板式蒸发器企业私有工程设计与智能报价工作台 — AiToMoney 内部研发验证环境</div>
      <div className="demo-note">⚠️ 当前页面包含演示数据（脱敏/合成），与真实客户任务在数据与界面上明确隔离；未接入的能力显示“未接入”，不代表真实执行进度。</div>

      <div className="grid">
        <div className="card">
          <div className="stat-num">{tasks.length}</div>
          <div className="stat-label">任务总数（含演示）</div>
        </div>
        <div className="card">
          <div className="stat-num">{holdCount}</div>
          <div className="stat-label">HOLD / 待确认事项</div>
        </div>
        <div className="card">
          <div className="stat-num">{materials.filter((m) => !m.provided).length}</div>
          <div className="stat-label">资料缺口</div>
        </div>
        <div className="card">
          <div className="stat-num">{reviews.length}</div>
          <div className="stat-label">待审核</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>当前阶段</h3>
        <p style={{ fontSize: 14, lineHeight: 1.8 }}>
          第一阶段（网站与展示）：进行中 — 独立站点、登录、五页面、脱敏示例与持久化业务记录。<br />
          第二阶段（云边接口联调）：未开始 — 待 AtmEdge 产品主线接口与联调任务卡。<br />
          第三阶段（客户制图验证接入）：HOLD — 客户样本、参数变更单、验收标准未齐。
        </p>
      </div>

      <div className="card">
        <h3>近期重点</h3>
        <table>
          <thead><tr><th>编号</th><th>类型</th><th>负责人</th><th>状态</th><th>下一步</th></tr></thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.code}</td><td>{t.type}</td><td>{t.owner}</td>
                <td>{statusBadge(t.status)}</td>
                <td className="muted">{t.next_step || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
