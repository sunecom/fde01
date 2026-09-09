// 初始化脚本：仅首次建库运行（幂等：已有 seed 标记则跳过且不重置）。
// 口令从环境变量读取，无默认口令回退。
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.FDE01_DB_PATH || path.join(process.cwd(), "data", "fde01.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT "viewer", created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS materials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, provided INTEGER NOT NULL DEFAULT 0, version TEXT DEFAULT "", owner TEXT DEFAULT "", gap_note TEXT DEFAULT "", is_demo INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, type TEXT NOT NULL, input_version TEXT DEFAULT "", owner TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "待资料", exec_log TEXT DEFAULT "", fail_reason TEXT DEFAULT "", next_step TEXT DEFAULT "", is_demo INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS results (id INTEGER PRIMARY KEY AUTOINCREMENT, task_code TEXT NOT NULL, kind TEXT NOT NULL, version TEXT NOT NULL, summary TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "未接入", source_ref TEXT DEFAULT "", is_demo INTEGER NOT NULL DEFAULT 1, category TEXT DEFAULT "");
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL, reviewer TEXT NOT NULL, result_version TEXT DEFAULT "", question TEXT DEFAULT "", opinion TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "待确认", is_demo INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT DEFAULT CURRENT_TIMESTAMP, operator TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, before_value TEXT DEFAULT "", after_value TEXT DEFAULT "");
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
`);

const seeded = db.prepare("SELECT v FROM meta WHERE k=?").get("seeded");
if (seeded && seeded.v === "1") { console.log("already seeded (idempotent, no reset)"); process.exit(0); }

const adminPw = process.env.INIT_ADMIN_PASSWORD;
const demoPw = process.env.INIT_DEMO_PASSWORD;
if (!adminPw || !demoPw || adminPw.length < 12 || demoPw.length < 12) {
  console.error("ERROR: INIT_ADMIN_PASSWORD / INIT_DEMO_PASSWORD (>=12 chars) required for first seed. Refusing.");
  process.exit(1);
}

const insUser = db.prepare("INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?,?,?)");
insUser.run("admin", bcrypt.hashSync(adminPw, 10), "admin");
insUser.run("demo", bcrypt.hashSync(demoPw, 10), "viewer");

// is_demo: 0=真实执行记录, 1=演示/合成数据
const insMat = db.prepare("INSERT INTO materials (name, provided, version, owner, gap_note, is_demo) VALUES (?,?,?,?,?,?)");
insMat.run("AiToMoney 网站页头 Logo（最终版）", 1, "已交付（复用官网页头版）", "高建国", "已接入网站页头（2026-09-09）；来源：aitomoney.online 官网 public/logo.png", 0);
insMat.run("客户 SolidWorks 模型与工程图样本（脱敏）", 0, "", "制图专项", "资料缺口：第三阶段前提，未到保持 HOLD", 1);
insMat.run("参数变更单（旧值/新值/单位/批准范围）", 0, "", "制图专项", "资料缺口", 1);
insMat.run("AspenSA 两工况验证成果（获准）", 1, "V0.3", "AtmEdge 产品主线", "已提供；与葡萄糖三效热耦合演示分列，不混写", 0);
insMat.run("葡萄糖三效热耦合演示", 1, "V0.2", "AtmEdge 产品主线", "客户当前有效清单指向此项", 0);
insMat.run("AtmEdge 云边协议文档（0.1.0 草案）", 1, "0.1.0 草案", "AtmEdge 产品主线", "已提供；接口未实现，不可直接调用", 0);
insMat.run("验收标准与工程师对照记录模板", 0, "", "项目总控", "资料缺口", 1);

const insTask = db.prepare("INSERT INTO tasks (code, type, input_version, owner, status, exec_log, fail_reason, next_step, is_demo) VALUES (?,?,?,?,?,?,?,?,?)");
insTask.run("FDE-CAD-01", "SolidWorks 参数变更制图验证", "未提供", "制图专项", "待资料", "", "客户样本与参数变更单未齐", "资料齐备并签发任务卡后启动（第三阶段）", 1);
insTask.run("FDE-SIM-01", "仿真演示接入（AspenSA 两工况 V0.3 / 葡萄糖三效热耦合 V0.2）", "V0.3/V0.2", "AtmEdge 产品主线", "待确认", "本地已有演示成果", "", "本地 AtmEdge 验证继续推进；云边联调按独立任务卡执行，不因客户图纸缺失整体停住", 1);
insTask.run("FDE-WEB-01", "工程工作台网站首版", "任务书 V0.1", "盖茨", "已提交", "网站开发与部署", "", "待项目总控复验（V0.2.2，提交 f92ea1b；两轮复核意见已整改）", 0);

const insRes = db.prepare("INSERT INTO results (task_code, kind, version, summary, status, source_ref, is_demo, category) VALUES (?,?,?,?,?,?,?,?)");
insRes.run("FDE-SIM-01", "H（工程师基准）", "—", "同题工程师工时数据未采集，效率比较显示 待测/N/A", "待测", "待核实（无采集记录）", 1, "模拟占位数据");
insRes.run("FDE-SIM-01", "A1（智能体首次）", "—", "未接入：云边接口未实现，不显示假进度", "未接入", "待核实（接口未实现）", 1, "模拟占位数据");
insRes.run("FDE-SIM-01", "C1（人工修正协同）", "—", "未接入：依赖 A1，A1 未产生前不生成", "未接入", "待核实（依赖 A1）", 1, "模拟占位数据");
insRes.run("FDE-WEB-01", "网站首版", "V0.2.2", "五页面 + 登录 + HTTPS + 数据隔离 + 审计；两轮复核意见已整改（提交 f92ea1b）", "已提交", "https://github.com/sunecom/fde01 (commit f92ea1b)", 0, "真实交付成果");
insRes.run("FDE-SIM-01", "AspenSA 两工况验证", "V0.3", "本地演示成果已跑过；获准复用，不等于客户工程验证通过", "待接入联调", "AtmEdge 产品主线（本地）", 1, "内部演示成果");
insRes.run("FDE-SIM-01", "葡萄糖三效热耦合演示", "V0.2", "本地演示成果已跑过；客户当前有效清单指向项", "待接入联调", "AtmEdge 产品主线（本地）", 1, "内部演示成果");

const insRev = db.prepare("INSERT INTO reviews (item, reviewer, result_version, question, opinion, status, is_demo) VALUES (?,?,?,?,?,?,?)");
insRev.run("网站首版验收", "柯大侠/项目总控", "FDE-WEB-01 V0.2.2", "网站 V0.2.2（f92ea1b）整改与验收证据（含隔离安装/审计回滚/备份恢复/重启保持实测）是否满足第一阶段验收", "待记录", "待确认", 0);
insRev.run("AspenSA 演示任务接入范围", "AtmEdge 产品主线", "协议 0.1.0 草案", "第二阶段联调任务卡边界与无副作用测试集", "待记录", "待确认", 1);

db.prepare("INSERT OR REPLACE INTO meta (k,v) VALUES (?,?)").run("seeded", "1");
console.log("seeded OK (credentials from env, not stored in repo)");
