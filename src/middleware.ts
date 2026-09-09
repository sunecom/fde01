import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_STR = process.env.AUTH_SECRET;
if (!SECRET_STR || SECRET_STR.length < 32) {
  throw new Error("AUTH_SECRET missing or too short. Refusing to start.");
}
const SECRET = new TextEncoder().encode(SECRET_STR);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) return NextResponse.next();
  const token = req.cookies.get("fde01_session")?.value;
  let ok = false;
  if (token) {
    try { await jwtVerify(token, SECRET); ok = true; } catch { ok = false; }
  }
  if (!ok) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录或会话过期" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png).*)"] };
