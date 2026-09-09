import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// 通用管理写接口：PATCH /api/admin/record
// body: { table: "materials"|"tasks"|"reviews", id: number, patch: { field: value, ... }
// 仅 admin 角色；校验 Origin；只允许白名单字段；写 audit_log
const TABLES: Record<string, { fields: string[]; label: string }> = {
  materials: { fields: ["provided", "version", "owner", "gap_note"], label: "资料" },
  tasks: { fields: ["status", "exec_log", "fail_reason", "next_step", "owner"], label: "任务" },
  reviews: { fields: ["opinion", "status"], label: "审核" },
};

export async function PATCH(req: NextRequest) {
  // Origin 校验（防 CSRF）
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Origin 不允许" }, { status: 403 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "只读账号无写权限" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.table !== "string" || typeof body.id !== "number" || !body.patch || typeof body.patch !== "object") {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const t = TABLES[body.table];
  if (!t) return NextResponse.json({ error: "不支持的表" }, { status: 400 });
  const id = Math.floor(body.id);
  if (id < 1) return NextResponse.json({ error: "id 非法" }, { status: 400 });

  // 只允许白名单字段 + 类型校验
  const patch: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(body.patch as Record<string, unknown>)) {
    if (!t.fields.includes(k)) return NextResponse.json({ error: `字段不允许: ${k}` }, { status: 400 });
    if (k === "provided") {
      if (v !== 0 && v !== 1) return NextResponse.json({ error: "provided 只能是 0/1" }, { status: 400 });
      patch[k] = v;
    } else {
      if (typeof v !== "string" || v.length > 2000) return NextResponse.json({ error: `${k} 必须是 ≤2000 字的文本` }, { status: 400 });
      patch[k] = v;
    }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "无有效字段" }, { status: 400 });

  const keys = Object.keys(patch);
  const before = db.prepare(`SELECT * FROM ${body.table} WHERE id=?`).get(id) as any;
  if (!before) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  const sets = keys.map((k) => `${k}=?`).join(", ");
  db.prepare(`UPDATE ${body.table} SET ${sets} WHERE id=?`).run(...keys.map((k) => patch[k]), id);

  // 审计：记录修改前后值、操作者、时间
  const beforeVals = JSON.stringify(Object.fromEntries(keys.map((k) => [k, before[k]])));
  const afterVals = JSON.stringify(patch);
  db.prepare("INSERT INTO audit_log (operator, action, target, before_value, after_value) VALUES (?,?,?,?,?)")
    .run(session.username, `update`, `${body.table}#${id}`, beforeVals, afterVals);

  return NextResponse.json({ ok: true });
}
