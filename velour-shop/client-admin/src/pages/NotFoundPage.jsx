import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          404
        </div>
        <h1
          style={{ fontFamily: "var(--serif)", fontSize: 34, marginBottom: 10 }}
        >
          Không tìm thấy trang quản trị
        </h1>
        <p style={{ color: "var(--mid-gray)", marginBottom: 24 }}>
          Đường dẫn bạn nhập không đúng hoặc trang đã được di chuyển.
        </p>
        <Link
          to="/admin/dashboard"
          className="btn-primary"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  );
}
