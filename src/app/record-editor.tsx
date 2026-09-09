"use client";
import { useState } from "react";

// admin 行内编辑器：table/id/field/value → PATCH /api/admin/record
export default function RecordEditor({ table, id, field, value, options, textarea }: {
  table: string; id: number; field: string; value: string | number;
  options?: string[]; textarea?: boolean;
}) {
  const [v, setV] = useState(String(value ?? ""));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true); setMsg("");
    let payload: string | number = v;
    if (field === "provided") payload = v === "1" ? 1 : 0;
    const r = await fetch("/api/admin/record", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, id, patch: { [field]: payload } }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false); setEditing(false);
    setMsg(r.ok ? "✓" : d.error || "失败");
    if (r.ok) setTimeout(() => location.reload(), 400);
  }

  if (!editing) {
    return (
      <span>
        {field === "provided" ? (value ? "已提供" : "未提供") : (value || "—")}
        {" "}
        <button className="edit-btn" onClick={() => setEditing(true)} title="编辑">✎</button>
        {msg && <span className="muted"> {msg}</span>}
      </span>
    );
  }
  return (
    <span className="editor-inline">
      {options ? (
        <select value={v} onChange={(e) => setV(e.target.value)} disabled={busy}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} disabled={busy} />
      ) : (
        <input value={v} onChange={(e) => setV(e.target.value)} disabled={busy} />
      )}
      <button className="edit-btn" onClick={save} disabled={busy}>{busy ? "…" : "保存"}</button>
      <button className="edit-btn" onClick={() => { setEditing(false); setV(String(value ?? "")); }}>取消</button>
    </span>
  );
}
