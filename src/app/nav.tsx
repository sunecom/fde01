"use client";
import { usePathname } from "next/navigation";

const NAV = [
  ["/", "项目总览"],
  ["/materials", "需求与资料"],
  ["/tasks", "任务中心"],
  ["/results", "成果与对照"],
  ["/reviews", "待审核事项"],
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      {NAV.map(([href, label]) => (
        <a key={href} href={href} className={pathname === href ? "on" : ""}>{label}</a>
      ))}
    </nav>
  );
}
