import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';

export default function ProductDetailPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedColor, setColor] = useState(0);
    const [selectedSize, setSize] = useState(0);
    const [toast, setToast] = useState(null);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        productAPI.getById(id).then(({ data }) => setProduct(data));
    }, [id]);

    if (!product) return <div className="loading">Đang tải sản phẩm...</div>;

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    };

    const handleAddToCart = () => {
        addToCart({
            ...product,
            selectedColor: product.colors?.[selectedColor] || '',
            selectedSize: product.sizes?.[selectedSize] || '',
        });
        showToast(`✓ Đã thêm "${product.name}" vào giỏ hàng`);
    };

    const discount = product.originalPrice > product.price
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    const EMOJIS = { 'Áo': '👕', 'Quần': '👖', 'Giày': '👟', 'Phụ kiện': '👜' };
    const emoji = EMOJIS[product.category] || '🛍️';

    return (
        <div>
            <button className="back-btn" onClick={() => navigate(-1)}>← Quay lại</button>
            <div className="detail-page">
                {/* Hình ảnh */}
                <div>
                    <div className="detail-img">
                        {product.images?.[0]
                            ? <img src={product.images[0]} alt={product.name} style={{ maxHeight: 480, maxWidth: '100%', objectFit: 'contain' }} />
                            : <span>{emoji}</span>
                        }
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        {(product.images?.length > 0 ? product.images : [emoji, '🔍', '📦']).map((img, i) => (
                            <div key={i} style={{
                                width: 80, height: 80, background: 'var(--warm-white)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '32px', cursor: 'pointer',
                                border: i === 0 ? '2px solid var(--charcoal)' : '1px solid var(--light-gray)',
                                overflow: 'hidden',
                            }}>
                                {typeof img === 'string' && img.startsWith('http')
                                    ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : img
                                }
                            </div>
                        ))}
                    </div>
                </div>

                {/* Thông tin */}
                <div>
                    <div className="detail-category">{product.category}</div>
                    <h1 className="detail-title">{product.name}</h1>
                    <div className="detail-rating">
                        <span className="detail-stars">{'★'.repeat(Math.round(product.rating || 5))}</span>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{(product.rating || 5).toFixed(1)}</span>
                        <span className="detail-reviews">({product.numReviews || 0} đánh giá)</span>
                    </div>

                    <div className="detail-price">{product.price?.toLocaleString('vi-VN')}đ</div>
                    {product.originalPrice > product.price && (
                        <div className="detail-original">
                            {product.originalPrice?.toLocaleString('vi-VN')}đ
                            <span style={{ color: 'var(--red)', marginLeft: 8, fontSize: 14 }}>-{discount}%</span>
                        </div>
                    )}

                    {product.colors?.length > 0 && (
                        <>
                            <div className="detail-section-label">Màu Sắc</div>
                            <div className="color-options">
                                {product.colors.map((c, i) => (
                                    <div key={i} className={`color-dot ${selectedColor === i ? 'selected' : ''}`}
                                        style={{ background: c, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                                        onClick={() => setColor(i)} />
                                ))}
                            </div>
                        </>
                    )}

                    {product.sizes?.length > 0 && (
                        <>
                            <div className="detail-section-label">Kích Thước</div>
                            <div className="size-options">
                                {product.sizes.map((s, i) => (
                                    <button key={i} className={`size-btn ${selectedSize === i ? 'selected' : ''}`}
                                        onClick={() => setSize(i)}>{s}</button>
                                ))}
                            </div>
                        </>
                    )}

                    <p className="detail-desc">{product.description}</p>

                    <button className="add-to-cart-btn" onClick={handleAddToCart}
                        disabled={product.countInStock === 0}>
                        {product.countInStock === 0 ? 'Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
                    </button>
                    <button className="wishlist-btn">♡ Thêm Vào Yêu Thích</button>

                    <div style={{ marginTop: 28, display: 'flex', gap: 24 }}>
                        {[['🚚', 'Miễn phí vận chuyển'], ['↩️', 'Đổi trả 30 ngày'], ['🛡️', 'Bảo hành chính hãng']].map(([em, t]) => (
                            <div key={t} style={{ textAlign: 'center', flex: 1 }}>
                                <div style={{ fontSize: 22, marginBottom: 6 }}>{em}</div>
                                <div style={{ fontSize: 11, color: 'var(--mid-gray)', letterSpacing: 1 }}>{t}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
