import { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../services/api";

const INITIAL_FORM = {
  siteTitle: "",
  metaDescription: "",
  metaKeywords: "",
  canonicalBaseUrl: "",
  robots: "index,follow",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
  twitterSite: "",
  homepageTitle: "",
  productsTitle: "",
  noindex: false,
};

export default function SeoDashboardPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const metaDescLength = useMemo(
    () => form.metaDescription.trim().length,
    [form.metaDescription],
  );
  const titleLength = useMemo(
    () => form.siteTitle.trim().length,
    [form.siteTitle],
  );

  const loadSeo = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await adminAPI.getSeoSettings();
      setForm({ ...INITIAL_FORM, ...data });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải SEO settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeo();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setMessage("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = { ...form };
      const { data } = await adminAPI.updateSeoSettings(payload);
      setForm({ ...INITIAL_FORM, ...(data.setting || payload) });
      setMessage("Đã lưu cấu hình SEO thành công");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu SEO settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải SEO Dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 30, marginBottom: 8, fontFamily: "var(--serif)" }}>
        SEO Dashboard
      </h1>
      <p style={{ color: "var(--mid-gray)", marginBottom: 24 }}>
        Quản lý title, meta description, Open Graph, Twitter Card và robots cho
        storefront.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ background: "white", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Title length</div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color:
                titleLength < 30 || titleLength > 60 ? "#b91c1c" : "#16a34a",
            }}
          >
            {titleLength}
          </div>
          <div style={{ fontSize: 12 }}>Khuyến nghị 30-60 ký tự</div>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Meta description length
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color:
                metaDescLength < 120 || metaDescLength > 160
                  ? "#b91c1c"
                  : "#16a34a",
            }}
          >
            {metaDescLength}
          </div>
          <div style={{ fontSize: 12 }}>Khuyến nghị 120-160 ký tự</div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        style={{ background: "white", borderRadius: 16, padding: 24 }}
      >
        <div className="form-group">
          <label className="form-label">Site Title</label>
          <input
            className="form-input"
            name="siteTitle"
            value={form.siteTitle}
            onChange={handleChange}
            placeholder="VELOUR Shop"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Meta Description</label>
          <textarea
            className="form-input"
            name="metaDescription"
            value={form.metaDescription}
            onChange={handleChange}
            rows={3}
            placeholder="Mô tả ngắn cho kết quả tìm kiếm..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Meta Keywords</label>
          <input
            className="form-input"
            name="metaKeywords"
            value={form.metaKeywords}
            onChange={handleChange}
            placeholder="thời trang, quần áo, velour..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Canonical Base URL</label>
            <input
              className="form-input"
              name="canonicalBaseUrl"
              value={form.canonicalBaseUrl}
              onChange={handleChange}
              placeholder="https://your-domain.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Robots</label>
            <select
              className="form-select"
              name="robots"
              value={form.robots}
              onChange={handleChange}
            >
              <option value="index,follow">index,follow</option>
              <option value="noindex,follow">noindex,follow</option>
              <option value="index,nofollow">index,nofollow</option>
              <option value="noindex,nofollow">noindex,nofollow</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Homepage Title</label>
            <input
              className="form-input"
              name="homepageTitle"
              value={form.homepageTitle}
              onChange={handleChange}
              placeholder="VELOUR Shop | Trang chủ"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Products Page Title</label>
            <input
              className="form-input"
              name="productsTitle"
              value={form.productsTitle}
              onChange={handleChange}
              placeholder="Sản phẩm | VELOUR Shop"
            />
          </div>
        </div>

        <div style={{ marginTop: 12, marginBottom: 8, fontWeight: 600 }}>
          Open Graph
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">OG Title</label>
            <input
              className="form-input"
              name="ogTitle"
              value={form.ogTitle}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">OG Image URL</label>
            <input
              className="form-input"
              name="ogImage"
              value={form.ogImage}
              onChange={handleChange}
              placeholder="https://.../banner.jpg"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">OG Description</label>
          <textarea
            className="form-input"
            name="ogDescription"
            value={form.ogDescription}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div style={{ marginTop: 12, marginBottom: 8, fontWeight: 600 }}>
          Twitter Card
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Twitter Card Type</label>
            <select
              className="form-select"
              name="twitterCard"
              value={form.twitterCard}
              onChange={handleChange}
            >
              <option value="summary">summary</option>
              <option value="summary_large_image">summary_large_image</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Twitter Site</label>
            <input
              className="form-input"
              name="twitterSite"
              value={form.twitterSite}
              onChange={handleChange}
              placeholder="@velourshop"
            />
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "10px 0 16px",
          }}
        >
          <input
            type="checkbox"
            name="noindex"
            checked={form.noindex}
            onChange={handleChange}
          />
          Bật noindex cho toàn site (chỉ dùng khi staging)
        </label>

        {error && (
          <div style={{ color: "#b91c1c", marginBottom: 10 }}>{error}</div>
        )}
        {message && (
          <div style={{ color: "#16a34a", marginBottom: 10 }}>{message}</div>
        )}

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu SEO Settings"}
        </button>
      </form>
    </div>
  );
}
