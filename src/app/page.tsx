export const dynamic = "force-dynamic";
import db from "@/lib/db";

export default function Home() {
  const tasks = db.prepare("SELECT * FROM tasks").all() as any[];
  const materials = db.prepare("SELECT * FROM materials").all() as any[];
  const reviews = db.prepare("SELECT * FROM reviews WHERE status != ?").all("已确认") as any[];

  const realTasks = tasks.filter((t) => !t.is_demo);
  const demoTasks = tasks.filter((t) => t.is_demo);
  const holdCount = tasks.filter((t) => ["待资料", "待确认"].includes(t.status)).length;

  return (
    <>
      <div className="page-title">项目总览</div>
      <div className="page-sub">FDE · 板式蒸发器企业私有工程设计与智能报价工作台 — AiToMoney 内部研发验证环境</div>
      <div className="demo-note">⚠️ 本页同时含真实执行记录（蓝标）与演示/合成数据（橙标），统计分开显示；未接入的能力显示“未接入”，不代表真实执行进度。</div>

      <div className="grid">
        <div className="card">
          <div className="stat-num">{realTasks.length}</div>
          <div className="stat-label">真实任务</div>
        </div>
        <div className="card">
          <div className="stat-num">{demoTasks.length}</div>
          <div className="stat-label">演示任务（不计入真实交付）</div>
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
          第一阶段（网站与展示）：已提交，待项目总控复验（修订意见 WEB-R01—08 整改中）。<br />
          第二阶段（云边接口联调）：未开始 — 待 AtmEdge 产品主线接口与联调任务卡。<br />
          第三阶段（客户制图验证接入）：HOLD — 客户样本、参数变更单、验收标准未齐。
        </p>
      </div>

      <div className="card">
        <h3>近期重点</h3>
        <table>
          <thead><tr><th>编号</th><th>类型</th><th>负责人</th><th>状态</th><th>数据</th><th>下一步</th></tr></thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>{t.code}</td><td>{t.type}</td><td>{t.owner}</td>
                <td>{t.status}</td>
                <td><span className={`badge ${t.is_demo ? "s-demo" : "s-real"}`}>{t.is_demo ? "演示" : "真实"}</span></td>
                <td className="muted">{t.next_step || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
