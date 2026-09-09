import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// 通用管理写接口：PATCH /api/admin/record
// body: { table: "materials"|"tasks"|"reviews", id: number, patch: { field: value, ... }
// 仅 admin 角色；校验 Origin；白名单字段 + 枚举校验；修改与审计同一事务
const TASK_STATUSES = ["待资料", "待确认", "排队", "运行", "待审核", "已提交", "失败", "完成"];
const REVIEW_STATUSES = ["待确认", "已确认"];
const TABLES: Record<string, { fields: string[]; enums: Record<string, string[]>; label: string }> = {
  materials: {
    fields: ["provided", "version", "owner", "gap_note"],
    enums: { provided: ["0", "1"] },
    label: "资料",
  },
  tasks: {
    fields: ["status", "exec_log", "fail_reason", "next_step", "owner"],
    enums: { status: TASK_STATUSES },
    label: "任务",
  },
  reviews: {
    fields: ["opinion", "status"],
    enums: { status: REVIEW_STATUSES },
    label: "审核",
  },
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

  // 只允许白名单字段 + 类型/枚举校验
  const patch: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(body.patch as Record<string, unknown>)) {
    if (!t.fields.includes(k)) return NextResponse.json({ error: `字段不允许: ${k}` }, { status: 400 });
    const enums = t.enums[k];
    if (enums) {
      if (typeof v !== "string" && typeof v !== "number") return NextResponse.json({ error: `${k} 类型错误` }, { status: 400 });
      if (!enums.includes(String(v))) return NextResponse.json({ error: `${k} 必须是: ${enums.join("/")}` }, { status: 400 });
      patch[k] = k === "provided" ? Number(v) : String(v);
    } else {
      if (typeof v !== "string" || v.length > 2000) return NextResponse.json({ error: `${k} 必须是 ≤2000 字的文本` }, { status: 400 });
      patch[k] = v;
    }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "无有效字段" }, { status: 400 });

  const keys = Object.keys(patch);
  const before = db.prepare(`SELECT * FROM ${body.table} WHERE id=?`).get(id) as any;
  if (!before) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  const beforeVals = JSON.stringify(Object.fromEntries(keys.map((k) => [k, before[k]])));
  const afterVals = JSON.stringify(patch);

  // 修改与审计同一事务：任一失败则整体回滚
  db.exec("BEGIN");
  try {
    const sets = keys.map((k) => `${k}=?`).join(", ");
    db.prepare(`UPDATE ${body.table} SET ${sets} WHERE id=?`).run(...keys.map((k) => patch[k]), id);
    db.prepare("INSERT INTO audit_log (operator, action, target, before_value, after_value) VALUES (?,?,?,?,?)")
      .run(session.username, "update", `${body.table}#${id}`, beforeVals, afterVals);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    console.error(`[admin] transaction failed: ${body.table}#${id}`);
    return NextResponse.json({ error: "写入失败，已回滚" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
