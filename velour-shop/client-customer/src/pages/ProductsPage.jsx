import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const asLabel = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.name || value.label || '';
    return String(value);
};

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || '';
    const collection = searchParams.get('collection') || '';
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState('newest');
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);

    useEffect(() => {
        productAPI.meta()
            .then(({ data }) => {
                const normalizedCategories = (data.categories || [])
                    .map(asLabel)
                    .filter(Boolean);
                const normalizedCollections = (data.collections || [])
                    .map(asLabel)
                    .filter(Boolean);

                setCategories([...new Set(normalizedCategories)]);
                setCollections([...new Set(normalizedCollections)]);
            })
            .catch(() => {
                setCategories([]);
                setCollections([]);
            });
    }, []);

    useEffect(() => {
        setLoading(true);
        productAPI.getAll({
            category: category || undefined,
            collection: collection || undefined,
            limit: 24,
            sort,
        })
            .then(({ data }) => {
                setProducts(data.products || []);
                setTotal(data.total || 0);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [category, collection, sort]);

    const setFilter = (nextCategory, nextCollection) => {
        const next = {};
        if (nextCategory) next.category = nextCategory;
        if (nextCollection) next.collection = nextCollection;
        setSearchParams(next);
    };

    return (
        <div>
            <div style={{ background: 'var(--charcoal)', color: 'white', padding: '40px 48px' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '48px', fontWeight: 400 }}>
                    {collection ? `Bộ Sưu Tập: ${collection}` : category || 'Tất Cả Sản Phẩm'}
                </h1>
                <p style={{ opacity: 0.8, marginTop: 8 }}>{total} sản phẩm</p>
            </div>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
                <div className="filter-row">
                    <div className="filter-group">
                        <span className="filter-label">Danh mục</span>
                        <div className="filter-chips">
                            <button
                                className={`filter-chip ${category === '' ? 'active' : ''}`}
                                onClick={() => setFilter('', collection)}
                            >
                                Tất cả
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    className={`filter-chip ${category === c ? 'active' : ''}`}
                                    onClick={() => setFilter(c, collection)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">Bộ sưu tập</span>
                        <div className="filter-chips">
                            <button
                                className={`filter-chip ${collection === '' ? 'active' : ''}`}
                                onClick={() => setFilter(category, '')}
                            >
                                Tất cả
                            </button>
                            {collections.map((col) => (
                                <button
                                    key={col}
                                    className={`filter-chip ${collection === col ? 'active' : ''}`}
                                    onClick={() => setFilter(category, col)}
                                >
                                    {col}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

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
