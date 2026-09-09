"use client";
export default function LogoutButton() {
  return (
    <button
      className="logout-btn"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        location.href = "/login";
      }}
    >
      退出
    </button>
  );
}
