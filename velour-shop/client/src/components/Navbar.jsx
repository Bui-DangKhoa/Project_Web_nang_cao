import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="nav">
            <Link to="/" className="nav-logo">VELOUR</Link>
            <div className="nav-links">
                <Link to="/" className="nav-link">Trang Chủ</Link>
                <Link to="/products" className="nav-link">Sản Phẩm</Link>
                <Link to="/products" className="nav-link">Bộ Sưu Tập</Link>
            </div>
            <div className="nav-actions">
                <Link to="/cart" className="nav-icon">
                    🛒 {cartCount > 0 && <span className="badge">{cartCount}</span>}
                </Link>
                {user ? (
                    <>
                        <Link to="/dashboard" className="nav-icon">👤</Link>
                        <button className="nav-btn" onClick={handleLogout}>Đăng Xuất</button>
                    </>
                ) : (
                    <button className="nav-btn" onClick={() => navigate('/login')}>Đăng Nhập</button>
                )}
            </div>
        </nav>
    );
}
