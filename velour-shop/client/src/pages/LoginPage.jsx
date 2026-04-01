import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [tab, setTab] = useState('login');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirm: '',
        activationId: '',
        activationToken: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register, activate } = useAuth();
    const navigate = useNavigate();

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async () => {
        setError('');
        setSuccess('');
        if (tab === 'signup' && form.password !== form.confirm)
            return setError('Mật khẩu không khớp');
        if (tab === 'signup' && !form.name)
            return setError('Vui lòng nhập họ tên');
        if ((tab === 'signup' || tab === 'login') && (!form.email || !form.password))
            return setError('Vui lòng điền đầy đủ thông tin');
        if (tab === 'activate' && (!form.activationId || !form.activationToken))
            return setError('Vui lòng nhập id và token kích hoạt từ email');
        try {
            setLoading(true);
            if (tab === 'login') {
                await login(form.email, form.password);
                navigate('/dashboard');
            } else if (tab === 'signup') {
                const res = await register(form.name, form.email, form.password);
                setSuccess(res.message || 'Đăng ký thành công. Vui lòng kiểm tra email để lấy id/token và kích hoạt tài khoản.');
                setTab('activate');
            } else {
                const res = await activate(form.activationId.trim(), form.activationToken.trim());
                setSuccess(res.message || 'Kích hoạt thành công. Vui lòng đăng nhập.');
                setTab('login');
            }
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
                    {[['login', 'Đăng Nhập'], ['signup', 'Đăng Ký'], ['activate', 'Kích Hoạt']].map(([t, l]) => (
                        <div
                            key={t}
                            className={`auth-tab ${tab === t ? 'active' : ''}`}
                            onClick={() => {
                                setTab(t);
                                setError('');
                                setSuccess('');
                            }}
                        >
                            {l}
                        </div>
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
                {tab === 'activate' && (
                    <>
                        <div className="form-group">
                            <label className="form-label">ID Tài Khoản</label>
                            <input
                                className="form-input"
                                name="activationId"
                                value={form.activationId}
                                onChange={handle}
                                onKeyDown={handleKeyDown}
                                placeholder="Ví dụ: 67fd..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Token Kích Hoạt</label>
                            <input
                                className="form-input"
                                name="activationToken"
                                value={form.activationToken}
                                onChange={handle}
                                onKeyDown={handleKeyDown}
                                placeholder="Token nhận từ email"
                            />
                        </div>
                    </>
                )}
                {tab === 'login' && (
                    <span className="forgot-link">Quên mật khẩu?</span>
                )}

                {error && <p className="error-msg">{error}</p>}
                {success && <p className="success-msg">{success}</p>}

                <button className="btn-primary" style={{ width: '100%', padding: 14 }} onClick={submit} disabled={loading}>
                    {loading
                        ? 'Đang xử lý...'
                        : tab === 'login'
                            ? 'Đăng Nhập'
                            : tab === 'signup'
                                ? 'Tạo Tài Khoản'
                                : 'Kích Hoạt Tài Khoản'}
                </button>
            </div>
        </div>
    );
}
