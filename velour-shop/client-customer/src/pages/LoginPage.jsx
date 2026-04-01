import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import {
  firebaseAuth,
  googleProvider,
  facebookProvider,
} from "../services/firebase";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    activationId: "",
    activationToken: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, activate, firebaseSocialLogin } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError("");
    setSuccess("");
    
    if (tab === "signup" && form.password !== form.confirm) {
      return setError("Mật khẩu không khớp");
    }
    if (tab === "signup" && !form.name) {
      return setError("Vui lòng điền họ tên");
    }
    if (tab === "signup" && !form.phone.trim()) {
      return setError("Vui lòng điền số điện thoại");
    }
    if ((tab === "signup" || tab === "login") && (!form.email || !form.password)) {
      return setError("Vui lòng điền đầy đủ thông tin");
    }
    if (tab === "login" && !form.email.includes("@")) {
      return setError("Tài khoản mới đăng ký vui lòng đăng nhập bằng email đã dùng khi đăng ký");
    }
    if (tab === "active" && (!form.activationId || !form.activationToken)) {
      return setError("Vui lòng điền đầy đủ ID và Token");
    }

    try {
      setLoading(true);
      if (tab === "login") {
        await login(form.email, form.password);
        navigate("/dashboard");
      } else if (tab === "signup") {
        const data = await register(
          form.name,
          form.email,
          form.password,
          form.phone,
        );
        setSuccess(
          data.message ||
            "Đăng ký thành công. Vui lòng kiểm tra email để lấy ID/Token và kích hoạt tài khoản.",
        );
        setTab("active");
      } else {
        const data = await activate(form.activationId.trim(), form.activationToken.trim());
        setSuccess(data.message || "Kích hoạt thành công. Vui lòng đăng nhập.");
        setTab("login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") submit();
  };

  const handleFirebaseProviderLogin = async (provider) => {
    try {
      setLoading(true);
      setError("");

      const selectedProvider =
        provider === "google" ? googleProvider : facebookProvider;
      const userCredential = await signInWithPopup(
        firebaseAuth,
        selectedProvider,
      );
      const idToken = await userCredential.user.getIdToken(true);
      await firebaseSocialLogin(idToken);

      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Không thể đăng nhập bằng ${provider === "google" ? "Google" : "Facebook"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">VELOUR</div>
        <p className="auth-tagline">
          Chào mừng trở lại, <em>người bạn thời trang</em> của chúng tôi
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-tabs">
          {[
            ["login", "Đăng Nhập"],
            ["signup", "Đăng Ký"],
            ["active", "Kích Hoạt"],
          ].map(([t, l]) => (
            <div
              key={t}
              className={`auth-tab ${tab === t ? "active" : ""}`}
              onClick={() => {
                setTab(t);
                setError("");
                setSuccess("");
              }}
            >
              {l}
            </div>
          ))}
        </div>

        {tab === "signup" && (
          <div className="form-group">
            <label className="form-label">Họ & Tên</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handle}
              onKeyDown={handleKeyDown}
              placeholder="Nguyễn Văn An"
            />
          </div>
        )}

        {tab === "signup" && (
          <div className="form-group">
            <label className="form-label">Số Điện Thoại</label>
            <input
              className="form-input"
              name="phone"
              value={form.phone}
              onChange={handle}
              onKeyDown={handleKeyDown}
              placeholder="0912 345 678"
            />
          </div>
        )}

        {tab === "active" && (
          <>
            <div className="form-group">
              <label className="form-label">ID Tài Khoản</label>
              <input
                className="form-input"
                name="activationId"
                value={form.activationId}
                onChange={handle}
                onKeyDown={handleKeyDown}
                placeholder="ID từ email"
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
                placeholder="Token từ email"
              />
            </div>
          </>
        )}

        {tab !== "active" && (
          <>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                onKeyDown={handleKeyDown}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật Khẩu</label>
              <input
                className="form-input"
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        {tab === "signup" && (
          <div className="form-group">
            <label className="form-label">Xác Nhận Mật Khẩu</label>
            <input
              className="form-input"
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handle}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
            />
          </div>
        )}

        {tab === "login" && <span className="forgot-link">Quên mật khẩu?</span>}

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        <button
          className="btn-primary"
          style={{ width: "100%", padding: 14 }}
          onClick={submit}
          disabled={loading}
        >
          {loading
            ? "Đang xử lý..."
            : tab === "login"
              ? "Đăng Nhập"
              : tab === "signup"
              ? "Tạo Tài Khoản"
              : "Kích Hoạt"}
        </button>

        {tab === "login" && (
          <>
            <div
              style={{
                textAlign: "center",
                margin: "14px 0 10px",
                color: "var(--mid-gray)",
                fontSize: 12,
              }}
            >
              hoặc đăng nhập nhanh
            </div>
            <div style={{ display: "grid", gap: 10, justifyItems: "center" }}>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: 12, width: 240 }}
                onClick={() => handleFirebaseProviderLogin("google")}
                disabled={loading}
              >
                Tiếp tục với Google
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: 12, width: 240 }}
                onClick={() => handleFirebaseProviderLogin("facebook")}
                disabled={loading}
              >
                Tiếp tục với Facebook
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
