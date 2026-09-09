import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

// 应用层失败限速：每 IP+用户名 15 分钟窗口最多 5 次失败（内存计数，进程级；网关层可再加 nginx limit_req）
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const fails = new Map<string, { count: number; until: number }>();

function rateLimited(key: string): boolean {
  const rec = fails.get(key);
  if (!rec) return false;
  if (Date.now() > rec.until) { fails.delete(key); return false; }
  return rec.count >= MAX_FAILS;
}
function recordFail(key: string) {
  const rec = fails.get(key);
  if (rec && Date.now() <= rec.until) rec.count += 1;
  else fails.set(key, { count: 1, until: Date.now() + WINDOW_MS });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const body = await req.json().catch(() => null);

  // 严格类型与长度校验
  if (!body || typeof body !== "object" ||
      typeof body.username !== "string" || typeof body.password !== "string" ||
      body.username.length < 1 || body.username.length > 64 ||
      body.password.length < 1 || body.password.length > 128) {
    return NextResponse.json({ error: "输入格式错误" }, { status: 400 });
  }
  const { username, password } = body;

  const key = `${ip}|${username}`;
  if (rateLimited(key)) {
    return NextResponse.json({ error: "失败次数过多，请 15 分钟后再试" }, { status: 429 });
  }

  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    recordFail(key);
    console.log(`[auth] login failed: ip=${ip} user=${username}`); // 不记录密码/令牌
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  fails.delete(key);
  const token = await createSession(user.username, user.role);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 12 * 3600, secure: true,
  });
  return res;
}
