import { useEffect, useState } from 'react';
import { productAPI } from '../services/api';

const EMPTY_PRODUCT = {
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    images: '',
    colors: '',
    sizes: '',
    countInStock: '',
    badge: '',
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_PRODUCT);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadProducts = () => {
        setLoading(true);
        productAPI
            .getAll({ page: 1, limit: 1000 })
            .then(({ data }) => {
                setProducts(data.products || []);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const resetMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        resetMessages();
    };

    const parseArrayField = (value) =>
        value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);

    const buildPayload = () => {
        return {
            name: form.name,
            description: form.description,
            price: Number(form.price) || 0,
            originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
            category: form.category,
            images: parseArrayField(form.images),
            colors: parseArrayField(form.colors),
            sizes: parseArrayField(form.sizes),
            countInStock: Number(form.countInStock) || 0,
            badge: form.badge || undefined,
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        resetMessages();
        setSaving(true);
        try {
            const payload = buildPayload();
            if (editingId) {
                await productAPI.update(editingId, payload);
                setSuccess('Đã cập nhật sản phẩm');
            } else {
                await productAPI.create(payload);
                setSuccess('Đã thêm sản phẩm mới');
            }
            setForm(EMPTY_PRODUCT);
            setEditingId(null);
            loadProducts();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (p) => {
        setEditingId(p._id);
        setForm({
            name: p.name || '',
            description: p.description || '',
            price: p.price?.toString() || '',
            originalPrice: p.originalPrice?.toString() || '',
            category: p.category || '',
            images: (p.images || []).join(', '),
            colors: (p.colors || []).join(', '),
            sizes: (p.sizes || []).join(', '),
            countInStock: p.countInStock?.toString() || '',
            badge: p.badge || '',
        });
        resetMessages();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        resetMessages();
        try {
            await productAPI.remove(id);
            setSuccess('Đã xóa sản phẩm');
            if (editingId === id) {
                setEditingId(null);
                setForm(EMPTY_PRODUCT);
            }
            loadProducts();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Không thể xóa sản phẩm';
            setError(msg);
        }
    };

    return (
        <div className="page" style={{ maxWidth: 1100, margin: '40px auto', padding: '0 16px' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, marginBottom: 24 }}>
                Quản lý sản phẩm
            </h1>

            <div
                style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 16,
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                    marginBottom: 32,
                }}
            >
                <h2 style={{ fontSize: 20, marginBottom: 16 }}>
                    {editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h2>

                {error && (
                    <div style={{ color: '#b91c1c', marginBottom: 12, fontSize: 14 }}>{error}</div>
                )}
                {success && (
                    <div style={{ color: '#16a34a', marginBottom: 12, fontSize: 14 }}>{success}</div>
                )}

                <form className="admin-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tên sản phẩm</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Danh mục</label>
                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Giá bán (đ)</label>
                            <input
                                name="price"
                                type="number"
                                min="0"
                                value={form.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Giá gốc (đ)</label>
                            <input
                                name="originalPrice"
                                type="number"
                                min="0"
                                value={form.originalPrice}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tồn kho</label>
                            <input
                                name="countInStock"
                                type="number"
                                min="0"
                                value={form.countInStock}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ảnh (URL, cách nhau bởi dấu phẩy)</label>
                            <input
                                name="images"
                                value={form.images}
                                onChange={handleChange}
                                placeholder="https://..., https://..."
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Màu sắc (cách nhau bởi dấu phẩy)</label>
                            <input
                                name="colors"
                                value={form.colors}
                                onChange={handleChange}
                                placeholder="Đen, Trắng, Be"
                            />
                        </div>
                        <div className="form-group">
                            <label>Kích cỡ (cách nhau bởi dấu phẩy)</label>
                            <input
                                name="sizes"
                                value={form.sizes}
                                onChange={handleChange}
                                placeholder="S, M, L, XL"
                            />
                        </div>
                        <div className="form-group">
                            <label>Badge</label>
                            <input
                                name="badge"
                                value={form.badge}
                                onChange={handleChange}
                                placeholder="Hot, New, Sale..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            name="description"
                            rows={4}
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? 'Đang lưu...'
                                : editingId
                                ? 'Cập nhật sản phẩm'
                                : 'Thêm sản phẩm'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setForm(EMPTY_PRODUCT);
                                    resetMessages();
                                }}
                            >
                                Hủy chỉnh sửa
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div
                style={{
                    background: 'white',
                    padding: 24,
                    borderRadius: 16,
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                }}
            >
                <h2 style={{ fontSize: 20, marginBottom: 16 }}>Danh sách sản phẩm</h2>
                {loading ? (
                    <div>Đang tải danh sách sản phẩm...</div>
                ) : products.length === 0 ? (
                    <div>Chưa có sản phẩm nào.</div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Tên</th>
                                    <th>Danh mục</th>
                                    <th>Giá</th>
                                    <th>Tồn kho</th>
                                    <th>Badge</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p._id}>
                                        <td>{p.name}</td>
                                        <td>{p.category}</td>
                                        <td>{p.price?.toLocaleString('vi-VN')}đ</td>
                                        <td>{p.countInStock}</td>
                                        <td>{p.badge}</td>
                                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <button
                                                className="table-btn"
                                                onClick={() => handleEdit(p)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className="table-btn table-btn-danger"
                                                onClick={() => handleDelete(p._id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

