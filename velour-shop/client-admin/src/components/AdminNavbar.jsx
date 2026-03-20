import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="nav">
      <Link to="/admin/products" className="nav-logo">
        VELOUR ADMIN
      </Link>
      <div className="nav-links">
        <Link to="/admin/dashboard" className="nav-link">
          SEO Dashboard
        </Link>
        <Link to="/admin/products" className="nav-link">
          Sản phẩm
        </Link>
      </div>
      <div className="nav-actions">
        {user ? (
          <button className="nav-btn" onClick={handleLogout}>
            Đăng Xuất
          </button>
        ) : (
          <button className="nav-btn" onClick={() => navigate("/login")}>
            Đăng Nhập
          </button>
        )}
      </div>
    </nav>
  );
}
