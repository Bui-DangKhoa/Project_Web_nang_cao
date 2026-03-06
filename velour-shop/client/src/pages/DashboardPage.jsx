import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CLASS = {
    'Đã giao': 'status-delivered',
    'Đang vận chuyển': 'status-shipping',
    'Chờ xác nhận': 'status-waiting',
    'Đang xử lý': 'status-shipping',
    'Đã hủy': 'status-cancelled',
};

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        orderAPI.myOrders()
            .then(({ data }) => setOrders(data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';
    const totalSpent = orders.reduce((sum, o) => sum + o.totalPrice, 0);

    const menuItems = [
        ['📊', 'Tổng Quan', 'overview'],
        ['📦', 'Đơn Hàng', 'orders'],
        ['❤️', 'Yêu Thích', 'wishlist'],
        ['📍', 'Địa Chỉ', 'address'],
        ['⚙️', 'Cài Đặt', 'settings'],
    ];

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">👤</div>
                    <div className="sidebar-name">{user?.name || 'Người dùng'}</div>
                    <div className="sidebar-email">{user?.email || ''}</div>
                </div>
                <ul className="sidebar-menu">
                    {menuItems.map(([em, label, tab]) => (
                        <li key={tab} className={`sidebar-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {em} {label}
                        </li>
                    ))}
                    <li className="sidebar-item" onClick={handleLogout}>🚪 Đăng Xuất</li>
                </ul>
            </div>

            {/* Content */}
            <div className="dash-content">
                <div className="dash-header">
                    <h1 className="dash-greeting">Xin chào, {user?.name?.split(' ').pop() || 'bạn'} 👋</h1>
                    <p className="dash-date">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Stats */}
                <div className="dash-stats">
                    {[
                        ['📦', orders.length.toString(), 'Đơn Hàng'],
                        ['❤️', '0', 'Yêu Thích'],
                        ['💰', (totalSpent / 1000000).toFixed(1) + 'M', 'Đã Chi Tiêu'],
                        ['⭐', '5.0', 'Điểm Đánh Giá'],
                    ].map(([em, val, label]) => (
                        <div key={label} className="dash-stat">
                            <div className="dash-stat-icon">{em}</div>
                            <div className="dash-stat-value">{val}</div>
                            <div className="dash-stat-label">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Orders Table */}
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 20 }}>Đơn Hàng Gần Đây</h3>
                {loading ? (
                    <div className="loading">Đang tải đơn hàng...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p>Bạn chưa có đơn hàng nào</p>
                        <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/products')}>Mua Sắm Ngay</button>
                    </div>
                ) : (
                    <div className="orders-table">
                        <div className="table-header">
                            <span>Mã Đơn</span>
                            <span>Ngày Đặt</span>
                            <span>Trạng Thái</span>
                            <span>Tổng Tiền</span>
                            <span>Chi Tiết</span>
                        </div>
                        {orders.map(o => (
                            <div key={o._id} className="table-row">
                                <span style={{ fontWeight: 500 }}>#{o._id.slice(-8).toUpperCase()}</span>
                                <span style={{ color: 'var(--mid-gray)' }}>
                                    {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                <span className={`status-pill ${STATUS_CLASS[o.status] || 'status-waiting'}`}>
                                    {o.status}
                                </span>
                                <span style={{ fontWeight: 600 }}>{fmt(o.totalPrice)}</span>
                                <span style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>Xem →</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Loyalty Banner */}
                <div style={{ marginTop: 32, background: 'var(--charcoal)', padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Ưu Đãi Thành Viên</p>
                        <p style={{ fontFamily: 'var(--serif)', color: 'white', fontSize: 22 }}>
                            Bạn có <strong style={{ color: 'var(--accent)' }}>2,400 điểm</strong> — đổi ngay!
                        </p>
                    </div>
                    <button className="btn-primary" onClick={() => navigate('/products')}>Mua Sắm</button>
                </div>
            </div>
        </div>
    );
}
