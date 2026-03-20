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
          Oops! Không tìm thấy trang
        </h1>
        <p style={{ color: "var(--mid-gray)", marginBottom: 24 }}>
          Link bạn vừa nhập không tồn tại. Hãy quay lại trang chủ hoặc duyệt sản
          phẩm.
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/"
            className="btn-primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Về Trang Chủ
          </Link>
          <Link
            to="/products"
            className="btn-outline"
            style={{
              textDecoration: "none",
              display: "inline-block",
              padding: "12px 18px",
            }}
          >
            Xem Sản Phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
