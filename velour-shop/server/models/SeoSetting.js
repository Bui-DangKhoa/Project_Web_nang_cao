const mongoose = require("mongoose");

const seoSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    siteTitle: { type: String, default: "VELOUR Shop" },
    metaDescription: {
      type: String,
      default:
        "VELOUR Shop - Thời trang hiện đại, chất lượng cao, giao hàng nhanh toàn quốc.",
    },
    metaKeywords: {
      type: String,
      default:
        "velour, thời trang, quần áo, áo, quần, phụ kiện, mua sắm online",
    },
    canonicalBaseUrl: { type: String, default: "http://localhost:5173" },
    robots: { type: String, default: "index,follow" },
    ogTitle: { type: String, default: "VELOUR Shop" },
    ogDescription: {
      type: String,
      default: "Khám phá bộ sưu tập thời trang mới nhất tại VELOUR Shop.",
    },
    ogImage: { type: String, default: "" },
    twitterCard: { type: String, default: "summary_large_image" },
    twitterSite: { type: String, default: "@velourshop" },
    homepageTitle: { type: String, default: "VELOUR Shop | Trang chủ" },
    productsTitle: { type: String, default: "Sản phẩm | VELOUR Shop" },
    noindex: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SeoSetting", seoSettingSchema);
