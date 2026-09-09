import { DatabaseSync } from "node:sqlite";
import path from "path";

const DB_PATH = process.env.FDE01_DB_PATH || path.join(process.cwd(), "data", "fde01.db");
const db = new DatabaseSync(DB_PATH);

// 幂等迁移：老库升级到当前 schema（CREATE TABLE IF NOT EXISTS 不会加列，必须显式迁移）
const MIGRATIONS: Array<[string, string]> = [
  ["materials", "ALTER TABLE materials ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 1"],
  ["tasks", "ALTER TABLE tasks ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 1"],
  ["results", "ALTER TABLE results ADD COLUMN source_ref TEXT DEFAULT ''"],
  ["results", "ALTER TABLE results ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 1"],
  ["reviews", "ALTER TABLE reviews ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 1"],
];
function tableExists(t: string): boolean {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
}
function columns(t: string): string[] {
  return (db.prepare(`PRAGMA table_info(${t})`).all() as any[]).map((c) => c.name);
}
for (const [table, ddl] of MIGRATIONS) {
  if (tableExists(table)) {
    const col = ddl.match(/ADD COLUMN (\w+)/)?.[1];
    if (col && !columns(table).includes(col)) {
      db.exec(ddl);
    }
  }
}
if (!tableExists("audit_log")) {
  db.exec("CREATE TABLE audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT DEFAULT CURRENT_TIMESTAMP, operator TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, before_value TEXT DEFAULT '', after_value TEXT DEFAULT '')");
}

export default db;
