import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "fde01.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT "viewer", created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS materials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, provided INTEGER NOT NULL DEFAULT 0, version TEXT DEFAULT "", owner TEXT DEFAULT "", gap_note TEXT DEFAULT "");
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, type TEXT NOT NULL, input_version TEXT DEFAULT "", owner TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "待资料", exec_log TEXT DEFAULT "", fail_reason TEXT DEFAULT "", next_step TEXT DEFAULT "");
CREATE TABLE IF NOT EXISTS results (id INTEGER PRIMARY KEY AUTOINCREMENT, task_code TEXT NOT NULL, kind TEXT NOT NULL, version TEXT NOT NULL, summary TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "未接入");
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT NOT NULL, reviewer TEXT NOT NULL, result_version TEXT DEFAULT "", question TEXT DEFAULT "", opinion TEXT DEFAULT "", status TEXT NOT NULL DEFAULT "待确认");
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
`);

const seeded = db.prepare("SELECT v FROM meta WHERE k=?").get("seeded");
if (seeded && seeded.v === "1") { console.log("already seeded"); process.exit(0); }

const insUser = db.prepare("INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?,?,?)");
insUser.run("admin", bcrypt.hashSync("Fde01Admin!2026", 10), "admin");
insUser.run("demo", bcrypt.hashSync("Fde01Demo!2026", 10), "viewer");

const insMat = db.prepare("INSERT INTO materials (name, provided, version, owner, gap_note) VALUES (?,?,?,?,?)");
insMat.run("AiToMoney 网站页头 Logo（最终版）", 0, "", "高建国", "资料缺口：等待交付（高哥本机路径 D:/AiToMoney/logo/…，未收到前页面以文字品牌名替代，不使用占位图）");
insMat.run("客户 SolidWorks 模型与工程图样本（脱敏）", 0, "", "制图专项", "资料缺口：第三阶段前提，未到保持 HOLD");
insMat.run("参数变更单（旧值/新值/单位/批准范围）", 0, "", "制图专项", "资料缺口");
insMat.run("AspenSA 三效蒸发演示成果（获准）", 1, "V0.3", "AtmEdge 产品主线", "已提供，第二阶段联调接入");
insMat.run("AtmEdge 云边协议文档（0.1.0 草案）", 1, "0.1.0 草案", "AtmEdge 产品主线", "已提供；接口未实现，不可直接调用");
insMat.run("验收标准与工程师对照记录模板", 0, "", "项目总控", "资料缺口");

const insTask = db.prepare("INSERT INTO tasks (code, type, input_version, owner, status, exec_log, fail_reason, next_step) VALUES (?,?,?,?,?,?,?,?)");
insTask.run("FDE-CAD-01", "SolidWorks 参数变更制图验证", "未提供", "制图专项", "待资料", "", "客户样本与参数变更单未齐", "资料齐备并签发任务卡后启动（第三阶段）");
insTask.run("FDE-SIM-01", "AspenSA 三效蒸发仿真演示复用", "V0.3", "AtmEdge 产品主线", "待确认", "本地已有演示成果", "", "等待云边接口联调任务卡（第二阶段）");
insTask.run("FDE-WEB-01", "工程工作台网站首版", "任务书 V0.1", "盖茨", "运行", "网站开发与部署", "", "第一阶段交付与验收");

const insRes = db.prepare("INSERT INTO results (task_code, kind, version, summary, status) VALUES (?,?,?,?,?)");
insRes.run("FDE-SIM-01", "H（工程师基准）", "—", "同题工程师工时数据未采集，效率比较显示 待测/N/A", "待测");
insRes.run("FDE-SIM-01", "A1（智能体首次）", "—", "未接入：云边接口未实现，不显示假进度", "未接入");
insRes.run("FDE-SIM-01", "C1（人工修正协同）", "—", "未接入：依赖 A1，A1 未产生前不生成", "未接入");
insRes.run("FDE-WEB-01", "网站首版", "V0.1.0", "5 页面 + 登录 + HTTPS，演示数据", "完成");

const insRev = db.prepare("INSERT INTO reviews (item, reviewer, result_version, question, opinion, status) VALUES (?,?,?,?,?,?)");
insRev.run("网站首版验收", "柯大侠/项目总控", "FDE-WEB-01 V0.1.0", "五个页面、登录、HTTPS、演示数据隔离是否满足第一阶段验收", "待记录", "待确认");
insRev.run("AspenSA 演示任务接入范围", "AtmEdge 产品主线", "协议 0.1.0 草案", "第二阶段联调任务卡边界与无副作用测试集", "待记录", "待确认");

db.prepare("INSERT OR REPLACE INTO meta (k,v) VALUES (?,?)").run("seeded", "1");
console.log("seeded OK");
