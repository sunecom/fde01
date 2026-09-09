export default function NotFound() {
  return (
    <div style={{ textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 40, fontWeight: 700, color: "#C8323C" }}>404</div>
      <p className="muted" style={{ marginTop: 8 }}>页面不存在或未实现（未实现的入口在首版中禁用）</p>
      <a href="/" style={{ color: "#C8323C", fontSize: 14, display: "inline-block", marginTop: 12 }}>返回总览</a>
    </div>
  );
}
