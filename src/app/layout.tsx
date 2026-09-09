import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import LogoutButton from "./logout-button";
import Nav from "./nav";

export const metadata: Metadata = {
  title: "AiToMoney FDE 工程工作台",
  description: "FDE 项目范围、资料缺口、任务进度、工程成果与待审核事项",
  robots: "noindex, nofollow",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  return (
    <html lang="zh-CN">
      <body>
        <header className="header">
          <div className="header-inner">
            <div className="brand">
              <img src="/logo.png" alt="AiToMoney" style={{ height: 26, width: "auto" }} />
              <small>FDE 工程工作台</small>
            </div>
            {session && (
              <>
                <Nav />
                <div className="spacer" />
                <span className="muted">{session.username}{session.role === "admin" ? "（管理员）" : "（只读）"}</span>
                <LogoutButton />
              </>
            )}
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <span>AiToMoney · 协同有界，价值无界</span>
            <span>内部研发验证环境 · 演示数据非客户生产</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
