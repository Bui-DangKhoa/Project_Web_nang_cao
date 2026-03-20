import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
    const [featured, setFeatured] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        productAPI.getAll({ limit: 6 }).then(({ data }) => setFeatured(data.products || []));
    }, []);

    return (
        <div>
            {/* HERO */}
            <div className="hero">
                <div className="hero-left">
                    <p className="hero-eyebrow">✦ Bộ Sưu Tập Mới 2026</p>
                    <h1 className="hero-title">Phong Cách <em>Vượt</em> Thời Gian</h1>
                    <p className="hero-desc">
                        Khám phá bộ sưu tập thời trang cao cấp được thiết kế cho người hiện đại —
                        nơi sự tinh tế gặp gỡ phong cách đường phố.
                    </p>
                    <div className="hero-btns">
                        <button className="btn-primary" onClick={() => navigate('/products')}>Khám Phá Ngay</button>
                        <button className="btn-outline" onClick={() => navigate('/products')}>Xem Lookbook</button>
                    </div>
                    <div className="hero-stats">
                        {[['10K+', 'Khách Hàng'], ['500+', 'Sản Phẩm'], ['4.9★', 'Đánh Giá']].map(([n, l]) => (
                            <div key={l}>
                                <div className="stat-num">{n}</div>
                                <div className="stat-label">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="hero-right">
                    <span className="hero-emoji">👗</span>
                    <span className="hero-tag">NEW ARRIVAL</span>
                </div>
            </div>

            {/* CATEGORIES */}
            <div className="section">
                <div className="section-header">
                    <h2 className="section-title">Danh Mục</h2>
                    <Link to="/products" className="section-link">Xem tất cả →</Link>
                </div>
                <div className="categories">
                    {[['👕', 'Áo'], ['👖', 'Quần'], ['👟', 'Giày'], ['👜', 'Phụ kiện']].map(([em, name]) => (
                        <div key={name} className="cat-card" onClick={() => navigate(`/products?category=${name}`)}>
                            <span className="cat-emoji">{em}</span>
                            <div className="cat-name">{name}</div>
                            <div className="cat-count">Xem bộ sưu tập <span className="cat-arrow">→</span></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURED PRODUCTS */}
            <div className="section" style={{ background: 'var(--warm-white)' }}>
                <div className="section-header">
                    <h2 className="section-title">Sản Phẩm Nổi Bật</h2>
                    <Link to="/products" className="section-link">Tất cả sản phẩm →</Link>
                </div>
                {featured.length > 0 ? (
                    <div className="products-grid">
                        {featured.slice(0, 6).map(p => <ProductCard key={p._id} product={p} />)}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--mid-gray)', fontFamily: 'var(--serif)', fontSize: '20px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛍️</div>
                        Chưa có sản phẩm nào. Hãy thêm sản phẩm qua API!
                    </div>
                )}
            </div>

            {/* BANNER */}
            <div style={{ background: 'var(--charcoal)', padding: '80px 48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--accent)', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '20px' }}>Ưu Đãi Đặc Biệt</p>
                <h2 style={{ fontFamily: 'var(--serif)', color: 'white', fontSize: '48px', fontWeight: 300, marginBottom: '20px' }}>
                    Giảm đến <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>30%</em> Toàn Bộ Sản Phẩm
                </h2>
                <p style={{ color: '#888', marginBottom: '36px' }}>Chỉ từ hôm nay đến cuối tháng</p>
                <button className="btn-primary" onClick={() => navigate('/products')}>Mua Sắm Ngay</button>
            </div>

            <div className="footer">© 2026 VELOUR — Thời Trang Cao Cấp Việt Nam</div>
        </div>
    );
}
