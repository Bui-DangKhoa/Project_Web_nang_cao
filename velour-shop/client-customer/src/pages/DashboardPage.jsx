import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CLASS = {
    'Đã giao': 'status-delivered',
    'Đang vận chuyển': 'status-shipping',
    'Chờ xác nhận': 'status-waiting',
    'Đang xử lý': 'status-shipping',
    'Đã hủy': 'status-cancelled',
};

const EMPTY_ADDRESS = {
    label: '',
    street: '',
    city: '',
    district: '',
    phone: '',
};

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [wishlistCount, setWishlistCount] = useState(0);
    const [addresses, setAddresses] = useState([]);
    const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
    const [savingAddress, setSavingAddress] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', confirm: '' });
    const [savingProfile, setSavingProfile] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        orderAPI.myOrders()
            .then(({ data }) => setOrders(data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const payment = searchParams.get('payment');
        const orderId = searchParams.get('orderId');
        const provider = payment?.startsWith('stripe')
            ? 'stripe'
            : payment?.startsWith('paypal')
                ? 'paypal'
                : payment?.startsWith('momo')
                    ? 'momo'
                    : payment?.startsWith('vnpay')
                        ? 'vnpay'
                    : null;

        if (!payment || !orderId || !provider) return;

        if (provider === 'vnpay') {
            if (payment.endsWith('success')) {
                setMessage(`Thanh toán VNPay thành công cho đơn #${orderId.slice(-8).toUpperCase()}`);
            } else if (payment.endsWith('pending')) {
                setMessage(`Đơn #${orderId.slice(-8).toUpperCase()} đang chờ xác nhận từ VNPay`);
            } else if (payment.endsWith('cancel')) {
                setMessage('Bạn đã hủy thanh toán VNPay');
            } else {
                setMessage('Thanh toán VNPay chưa hoàn tất');
            }

            orderAPI.myOrders()
                .then(({ data }) => setOrders(data))
                .catch(() => {} )
                .finally(() => {
                    setSearchParams({}, { replace: true });
                });
            return;
        }

        if (payment.endsWith('success') || payment.endsWith('pending')) {
            orderAPI.confirmDemoPayment(orderId, {
                provider,
                transactionNo: `${provider.toUpperCase()}-${Date.now()}`,
            })
                .then(({ data }) => {
                    setOrders((prev) => {
                        const next = prev.map((o) => (o._id === orderId ? data.order : o));
                        if (!next.find((o) => o._id === orderId)) {
                            next.unshift(data.order);
                        }
                        return next;
                    });
                    setMessage(`Thanh toán ${provider.toUpperCase()} demo thành công cho đơn #${orderId.slice(-8).toUpperCase()}`);
                })
                .catch((err) => {
                    setMessage(err.response?.data?.message || 'Không thể xác nhận thanh toán demo');
                })
                .finally(() => {
                    setSearchParams({}, { replace: true });
                });
        }

        if (payment.endsWith('cancel')) {
            setMessage(`Bạn đã hủy thanh toán ${provider.toUpperCase()} demo`);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Lấy thông tin profile: wishlist + addresses
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setWishlistCount(0);
                setAddresses([]);
                return;
            }
            try {
                const { data } = await userAPI.getProfile();
                setWishlistCount((data.wishlist || []).length);
                setAddresses(data.addresses || []);
                setProfileForm((prev) => ({
                    ...prev,
                    name: data.name || prev.name,
                    email: data.email || prev.email,
                }));
            } catch {
                setWishlistCount(0);
                setAddresses([]);
            }
        };
        fetchProfile();
    }, [user]);

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

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddressForm((prev) => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handleAddAddress = async () => {
        if (!addressForm.label || !addressForm.street || !addressForm.phone) {
            setMessage('Vui lòng điền ít nhất tên địa chỉ, địa chỉ và số điện thoại');
            return;
        }
        try {
            setSavingAddress(true);
            const next = [...addresses, addressForm];
            const { data } = await userAPI.updateProfile({ addresses: next });
            setAddresses(data.addresses || next);
            setAddressForm(EMPTY_ADDRESS);
            setMessage('Đã lưu địa chỉ mới');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Không thể lưu địa chỉ');
        } finally {
            setSavingAddress(false);
        }
    };

    const handleRemoveAddress = async (index) => {
        try {
            setSavingAddress(true);
            const next = addresses.filter((_, i) => i !== index);
            const { data } = await userAPI.updateProfile({ addresses: next });
            setAddresses(data.addresses || next);
            setMessage('Đã xóa địa chỉ');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Không thể xóa địa chỉ');
        } finally {
            setSavingAddress(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
        setMessage('');
    };

    const handleSaveProfile = async () => {
        if (profileForm.password && profileForm.password !== profileForm.confirm) {
            setMessage('Mật khẩu xác nhận không khớp');
            return;
        }
        try {
            setSavingProfile(true);
            const payload = {
                name: profileForm.name,
                email: profileForm.email,
            };
            if (profileForm.password) {
                payload.password = profileForm.password;
            }
            await userAPI.updateProfile(payload);
            setProfileForm((prev) => ({ ...prev, password: '', confirm: '' }));
            setMessage('Đã lưu thông tin tài khoản');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Không thể lưu thông tin tài khoản');
        } finally {
            setSavingProfile(false);
        }
    };

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

                {message && (
                    <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--green)' }}>
                        {message}
                    </div>
                )}

                {/* Stats */}
                <div className="dash-stats">
                    {[
                        ['📦', orders.length.toString(), 'Đơn Hàng'],
                        ['❤️', wishlistCount.toString(), 'Yêu Thích'],
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

                {/* Overview & Orders */}
                {(activeTab === 'overview' || activeTab === 'orders') && (
                    <>
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

                        {activeTab === 'overview' && (
                            <div style={{ marginTop: 32, background: 'var(--charcoal)', padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ color: 'var(--accent)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Ưu Đãi Thành Viên</p>
                                    <p style={{ fontFamily: 'var(--serif)', color: 'white', fontSize: 22 }}>
                                        Bạn có <strong style={{ color: 'var(--accent)' }}>2,400 điểm</strong> — đổi ngay!
                                    </p>
                                </div>
                                <button className="btn-primary" onClick={() => navigate('/products')}>Mua Sắm</button>
                            </div>
                        )}
                    </>
                )}

                {/* Địa chỉ */}
                {activeTab === 'address' && (
                    <div style={{ marginTop: 24 }}>
                        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 16 }}>Địa chỉ giao hàng</h3>
                        {addresses.length === 0 ? (
                            <p style={{ fontSize: 14, color: 'var(--mid-gray)', marginBottom: 16 }}>Bạn chưa lưu địa chỉ nào.</p>
                        ) : (
                            <div style={{ marginBottom: 24 }}>
                                {addresses.map((addr, idx) => (
                                    <div key={idx} style={{ background: 'var(--warm-white)', padding: 16, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{addr.label}</div>
                                            <div style={{ fontSize: 13 }}>{addr.street}</div>
                                            <div style={{ fontSize: 13 }}>{addr.district} {addr.city}</div>
                                            <div style={{ fontSize: 13, color: 'var(--mid-gray)' }}>Điện thoại: {addr.phone}</div>
                                        </div>
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveAddress(idx)}
                                            style={{ marginTop: 0 }}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <h4 style={{ fontSize: 16, marginBottom: 12 }}>Thêm địa chỉ mới</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tên địa chỉ</label>
                                <input
                                    className="form-input"
                                    name="label"
                                    value={addressForm.label}
                                    onChange={handleAddressChange}
                                    placeholder="Nhà riêng, Công ty..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thành phố</label>
                                <input
                                    className="form-input"
                                    name="city"
                                    value={addressForm.city}
                                    onChange={handleAddressChange}
                                    placeholder="Hồ Chí Minh"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Quận/Huyện</label>
                                <input
                                    className="form-input"
                                    name="district"
                                    value={addressForm.district}
                                    onChange={handleAddressChange}
                                    placeholder="Quận 1"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Số điện thoại</label>
                                <input
                                    className="form-input"
                                    name="phone"
                                    value={addressForm.phone}
                                    onChange={handleAddressChange}
                                    placeholder="0912 345 678"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Địa chỉ chi tiết</label>
                            <input
                                className="form-input"
                                name="street"
                                value={addressForm.street}
                                onChange={handleAddressChange}
                                placeholder="123 Đường Lê Lợi..."
                            />
                        </div>
                        <button
                            className="btn-primary"
                            style={{ marginTop: 8 }}
                            onClick={handleAddAddress}
                            disabled={savingAddress}
                        >
                            {savingAddress ? 'Đang lưu...' : 'Lưu địa chỉ'}
                        </button>
                    </div>
                )}

                {/* Cài đặt tài khoản */}
                {activeTab === 'settings' && (
                    <div style={{ marginTop: 24, maxWidth: 480 }}>
                        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, marginBottom: 16 }}>Cài đặt tài khoản</h3>
                        <div className="form-group">
                            <label className="form-label">Họ và tên</label>
                            <input
                                className="form-input"
                                name="name"
                                value={profileForm.name}
                                onChange={handleProfileChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                name="email"
                                type="email"
                                value={profileForm.email}
                                onChange={handleProfileChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mật khẩu mới</label>
                            <input
                                className="form-input"
                                name="password"
                                type="password"
                                value={profileForm.password}
                                onChange={handleProfileChange}
                                placeholder="Để trống nếu không đổi"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Xác nhận mật khẩu</label>
                            <input
                                className="form-input"
                                name="confirm"
                                type="password"
                                value={profileForm.confirm}
                                onChange={handleProfileChange}
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                        >
                            {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
