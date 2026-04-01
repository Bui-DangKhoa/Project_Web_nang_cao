import { useNavigate } from 'react-router-dom';

const asCategoryLabel = (category) => {
    if (!category) return '';
    if (typeof category === 'string') return category;
    if (typeof category === 'object') return category.name || '';
    return String(category);
};

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const fmt = (n) => n?.toLocaleString('vi-VN') + 'đ';
    const categoryLabel = asCategoryLabel(product.category);

    const EMOJIS = {
        'Áo': '👕', 'Quần': '👖', 'Giày': '👟', 'Phụ kiện': '👜',
        'Đồng hồ': '⌚', 'Kính': '🕶️',
    };
    const emoji = EMOJIS[categoryLabel] || '🛍️';

    return (
        <div className="product-card" onClick={() => navigate(`/products/${product._id}`)}>
            <div className="product-img-wrap">
                {product.badge && (
                    <span className={`product-badge badge-${product.badge.toLowerCase()}`}>
                        {product.badge}
                    </span>
                )}
                {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{emoji}</span>
                }
                <div className="product-overlay">
                    <span className="overlay-btn">Xem Chi Tiết</span>
                </div>
            </div>
            <div className="product-info">
                <div className="product-cat">{categoryLabel}</div>
                <div className="product-name">{product.name}</div>
                <div className="product-footer">
                    <div>
                        <span className="product-price">{fmt(product.price)}</span>
                        {product.originalPrice > product.price && (
                            <span className="product-original">{fmt(product.originalPrice)}</span>
                        )}
                    </div>
                    <span className="product-rating">★ {product.rating?.toFixed(1) || '5.0'}</span>
                </div>
            </div>
        </div>
    );
}
