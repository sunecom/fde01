"use client";
import { useState } from "react";

export default function LoginPage() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    if (r.ok) { location.href = "/"; }
    else { const d = await r.json().catch(() => ({})); setErr(d.error || "登录失败"); setBusy(false); }
  }

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <h1>AiToMoney FDE 工程工作台</h1>
        <p>内部系统，请登录后访问</p>
        {err && <div className="login-err">{err}</div>}
        <input placeholder="用户名" value={u} onChange={(e) => setU(e.target.value)} autoFocus />
        <input placeholder="密码" type="password" value={p} onChange={(e) => setP(e.target.value)} />
        <button disabled={busy || !u || !p}>{busy ? "登录中…" : "登录"}</button>
      </form>
    </div>
  );
}
