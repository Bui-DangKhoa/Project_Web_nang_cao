import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category') || '';
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('newest');

    useEffect(() => {
        setLoading(true);
        productAPI.getAll({ category: category || undefined, limit: 24, sort })
            .then(({ data }) => {
                setProducts(data.products || []);
                setTotal(data.total || 0);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [category, sort]);

    return (
        <div>
            <div style={{ background: 'var(--charcoal)', color: 'white', padding: '40px 48px' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', fontWeight: 400 }}>
                    {category || 'Tất Cả Sản Phẩm'}
                </h1>
                <p style={{ opacity: 0.8, marginTop: 8 }}>{total} sản phẩm</p>
            </div>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-select" style={{ width: 200 }}>
                        <option value="newest">Mới nhất</option>
                        <option value="price_asc">Giá thấp → cao</option>
                        <option value="price_desc">Giá cao → thấp</option>
                        <option value="popular">Phổ biến</option>
                    </select>
                </div>
                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : products.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🛍️</div>
                        <p>Chưa có sản phẩm nào</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map((p) => <ProductCard key={p._id} product={p} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
