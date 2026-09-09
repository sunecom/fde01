import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import LogoutButton from "./logout-button";

export const metadata: Metadata = {
  title: "AiToMoney FDE 工程工作台",
  description: "FDE 项目范围、资料缺口、任务进度、工程成果与待审核事项",
  robots: "noindex, nofollow",
};

const NAV = [
  ["/", "项目总览"],
  ["/materials", "需求与资料"],
  ["/tasks", "任务中心"],
  ["/results", "成果与对照"],
  ["/reviews", "待审核事项"],
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  return (
    <html lang="zh-CN">
      <body>
        <header className="header">
          <div className="header-inner">
            <div className="brand">AiToMoney <small>FDE 工程工作台</small></div>
            {session && (
              <>
                <nav className="nav">
                  {NAV.map(([href, label]) => (
                    <a key={href} href={href}>{label}</a>
                  ))}
                </nav>
                <div className="spacer" />
                <span className="muted">{session.username}</span>
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
