import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [tab, setTab] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async () => {
        setError('');
        if (tab === 'signup' && form.password !== form.confirm)
            return setError('Mật khẩu không khớp');
        if (!form.email || !form.password)
            return setError('Vui lòng điền đầy đủ thông tin');
        try {
            setLoading(true);
            if (tab === 'login') await login(form.email, form.password);
            else await register(form.name, form.email, form.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') submit();
    };

    return (
        <div className="auth-page">
            {/* Left panel */}
            <div className="auth-left">
                <div className="auth-brand">VELOUR</div>
                <p className="auth-tagline">Chào mừng trở lại, <em>người bạn thời trang</em> của chúng tôi</p>
            </div>

            {/* Right panel */}
            <div className="auth-right">
                <div className="auth-tabs">
                    {[['login', 'Đăng Nhập'], ['signup', 'Đăng Ký']].map(([t, l]) => (
                        <div key={t} className={`auth-tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setError(''); }}>{l}</div>
                    ))}
                </div>

                {tab === 'signup' && (
                    <div className="form-group">
                        <label className="form-label">Họ & Tên</label>
                        <input className="form-input" name="name" value={form.name} onChange={handle} onKeyDown={handleKeyDown} placeholder="Nguyễn Văn An" />
                    </div>
                )}
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" name="email" type="email" value={form.email} onChange={handle} onKeyDown={handleKeyDown} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                    <label className="form-label">Mật Khẩu</label>
                    <input className="form-input" name="password" type="password" value={form.password} onChange={handle} onKeyDown={handleKeyDown} placeholder="••••••••" />
                </div>
                {tab === 'signup' && (
                    <div className="form-group">
                        <label className="form-label">Xác Nhận Mật Khẩu</label>
                        <input className="form-input" name="confirm" type="password" value={form.confirm} onChange={handle} onKeyDown={handleKeyDown} placeholder="••••••••" />
                    </div>
                )}
                {tab === 'login' && (
                    <span className="forgot-link">Quên mật khẩu?</span>
                )}

                {error && <p className="error-msg">{error}</p>}

                <button className="btn-primary" style={{ width: '100%', padding: 14 }} onClick={submit} disabled={loading}>
                    {loading ? 'Đang xử lý...' : tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
                </button>
            </div>
        </div>
    );
}
