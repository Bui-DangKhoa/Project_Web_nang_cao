import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const EMOJIS = { 'Áo': '👕', 'Quần': '👖', 'Giày': '👟', 'Phụ kiện': '👜' };

export default function CartPage() {
    const { cart, updateQty, removeItem, cartTotal } = useCart();
    const navigate = useNavigate();
    const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';

    return (
        <div>
            <div style={{ background: 'var(--charcoal)', color: 'white', padding: '40px 48px' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', fontWeight: 400 }}>Giỏ Hàng</h1>
            </div>
            <div className="cart-page">
                <div>
                    {cart.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🛒</div>
                            <p>Giỏ hàng của bạn đang trống</p>
                            <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/products')}>Mua Sắm Ngay</button>
                        </div>
                    ) : cart.map(item => (
                        <div key={`${item._id}-${item.selectedSize}`} className="cart-item">
                            <div className="cart-item-emoji">
                                {item.images?.[0]
                                    ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : EMOJIS[item.category] || '🛍️'
                                }
                            </div>
                            <div className="cart-item-info">
                                <div className="cart-item-name">{item.name}</div>
                                <div className="cart-item-meta">{item.category} · Size {item.selectedSize} · Màu {item.selectedColor}</div>
                                <div className="cart-qty">
                                    <button className="qty-btn" onClick={() => updateQty(item._id, item.selectedSize, -1)}>−</button>
                                    <span className="qty-num">{item.qty}</span>
                                    <button className="qty-btn" onClick={() => updateQty(item._id, item.selectedSize, 1)}>+</button>
                                </div>
                                <button className="remove-btn" onClick={() => removeItem(item._id, item.selectedSize)}>Xóa</button>
                            </div>
                            <div className="cart-item-price">{fmt(item.price * item.qty)}</div>
                        </div>
                    ))}
                </div>

                <div className="order-summary">
                    <div className="summary-title">Tóm Tắt Đơn Hàng</div>
                    {cart.map(i => (
                        <div key={`${i._id}-${i.selectedSize}`} className="summary-row">
                            <span>{i.name} ×{i.qty}</span>
                            <span>{fmt(i.price * i.qty)}</span>
                        </div>
                    ))}
                    <div className="summary-row">
                        <span>Phí vận chuyển</span>
                        <span style={{ color: 'var(--green)' }}>Miễn phí</span>
                    </div>
                    <div className="summary-row total">
                        <span>Tổng cộng</span>
                        <span style={{ color: 'var(--accent)' }}>{fmt(cartTotal)}</span>
                    </div>
                    <input className="coupon-input" placeholder="Nhập mã giảm giá..." />
                    <button className="apply-btn">Áp Dụng</button>
                    <button className="btn-primary" style={{ width: '100%', padding: 16, marginTop: 20 }}
                        onClick={() => navigate('/checkout')} disabled={cart.length === 0}>
                        Thanh Toán →
                    </button>
                </div>
            </div>
        </div>
    );
}
