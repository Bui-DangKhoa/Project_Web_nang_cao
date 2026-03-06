import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', street: '', city: 'Hồ Chí Minh', district: '', phone: '',
    });
    const [paymentMethod, setPayment] = useState('cod');
    const [loading, setLoading] = useState(false);
    const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const placeOrder = async () => {
        if (!form.name || !form.street || !form.phone)
            return alert('Vui lòng điền đầy đủ thông tin giao hàng');
        try {
            setLoading(true);
            const order = await orderAPI.create({
                orderItems: cart.map(i => ({
                    name: i.name, qty: i.qty, image: i.images?.[0] || '',
                    price: i.price, product: i._id,
                    color: i.selectedColor, size: i.selectedSize,
                })),
                shippingAddress: form,
                paymentMethod,
                itemsPrice: cartTotal,
                totalPrice: cartTotal,
            });
            clearCart();
            navigate('/dashboard', { state: { newOrder: order.data._id } });
        } catch (err) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button className="back-btn" onClick={() => navigate('/cart')}>← Quay lại giỏ hàng</button>
            <div className="checkout-page">
                <div>
                    <h1 className="checkout-title">Thanh Toán</h1>
                    <p className="checkout-subtitle">Hoàn tất đơn hàng của bạn</p>

                    {/* Thông tin giao hàng */}
                    <div className="form-section">
                        <div className="form-section-title">Thông Tin Giao Hàng</div>
                        {[['name', 'Họ & Tên', 'Nguyễn Văn An'], ['street', 'Địa Chỉ', '123 Đường Lê Lợi'], ['phone', 'Số Điện Thoại', '0912 345 678']].map(([fieldName, label, ph]) => (
                            <div key={fieldName} className="form-group">
                                <label className="form-label">{label}</label>
                                <input className="form-input" name={fieldName} value={form[fieldName]} onChange={handle} placeholder={ph} />
                            </div>
                        ))}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Thành Phố</label>
                                <select className="form-select" name="city" value={form.city} onChange={handle}>
                                    <option>Hồ Chí Minh</option>
                                    <option>Hà Nội</option>
                                    <option>Đà Nẵng</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quận/Huyện</label>
                                <input className="form-input" name="district" value={form.district} onChange={handle} placeholder="Quận 1" />
                            </div>
                        </div>
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="form-section">
                        <div className="form-section-title">Phương Thức Thanh Toán</div>
                        <div className="payment-methods">
                            {[['cod', '💵', 'Thanh toán khi nhận hàng'], ['bank', '🏦', 'Chuyển khoản ngân hàng'], ['momo', '💜', 'Ví MoMo'], ['card', '💳', 'Thẻ tín dụng/ghi nợ']].map(([val, em, label]) => (
                                <div key={val} className={`payment-option ${paymentMethod === val ? 'selected' : ''}`}
                                    onClick={() => setPayment(val)}>
                                    <div className="payment-radio">
                                        {paymentMethod === val && <div className="payment-radio-inner" />}
                                    </div>
                                    <span style={{ fontSize: 20 }}>{em}</span>
                                    <span className="payment-name">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="btn-primary" style={{ width: '100%', padding: 16 }}
                        onClick={placeOrder} disabled={loading || cart.length === 0}>
                        {loading ? 'Đang xử lý...' : 'Xác Nhận Đặt Hàng'}
                    </button>
                </div>

                {/* Sidebar */}
                <div className="checkout-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">Đơn Hàng ({cart.length} sản phẩm)</div>
                        {cart.map(i => (
                            <div key={`${i._id}-${i.selectedSize}`} className="mini-cart-item">
                                <div className="mini-cart-emoji">
                                    {i.images?.[0]
                                        ? <img src={i.images[0]} alt={i.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : '🛍️'
                                    }
                                </div>
                                <div>
                                    <div className="mini-cart-name">{i.name}</div>
                                    <div className="mini-cart-meta">×{i.qty} · {i.selectedSize}</div>
                                </div>
                                <div className="mini-cart-price">{fmt(i.price * i.qty)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="sidebar-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                            <span>Tạm tính</span><span>{fmt(cartTotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                            <span>Vận chuyển</span><span style={{ color: 'var(--green)' }}>Miễn phí</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600, paddingTop: 12, borderTop: '1px solid var(--light-gray)' }}>
                            <span>Tổng cộng</span>
                            <span style={{ color: 'var(--accent)' }}>{fmt(cartTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
