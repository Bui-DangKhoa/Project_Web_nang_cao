import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['Tất cả', 'Áo', 'Quần', 'Giày', 'Phụ kiện'];

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || 'Tất cả';
    const sort = searchParams.get('sort') || 'newest';

    useEffect(() => {
        setLoading(true);
        const params = { sort };
        if (category !== 'Tất cả') params.category = category;
        productAPI.getAll(params)
            .then(({ data }) => { setProducts(data.products || []); setTotal(data.total || 0); })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [category, sort]);

    const setFilter = (cat) => {
        const p = new URLSearchParams(searchParams);
        if (cat === 'Tất cả') p.delete('category');
        else p.set('category', cat);
        setSearchParams(p);
    };

    const setSort = (s) => {
        const p = new URLSearchParams(searchParams);
        p.set('sort', s);
        setSearchParams(p);
    };

    return (
        <div>
            <div style={{ background: 'var(--charcoal)', color: 'white', padding: '40px 48px' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', fontWeight: 400 }}>Bộ Sưu Tập</h1>
                <p style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>{total} sản phẩm</p>
            </div>

            <div className="filter-bar">
                <span className="filter-label">Lọc theo:</span>
                {CATEGORIES.map(cat => (
                    <button key={cat} className={`filter-chip ${category === cat ? 'active' : ''}`}
                        onClick={() => setFilter(cat)}>{cat}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                    <select className="form-select" style={{ padding: '8px 16px', width: 'auto' }}
                        value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="newest">Sắp xếp: Mới nhất</option>
                        <option value="price_asc">Giá thấp → cao</option>
                        <option value="price_desc">Giá cao → thấp</option>
                        <option value="popular">Phổ biến nhất</option>
                    </select>
                </div>
            </div>

            <div className="section">
                {loading ? (
                    <div className="loading">Đang tải sản phẩm...</div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛍️</div>
                        <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map(p => <ProductCard key={p._id} product={p} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
