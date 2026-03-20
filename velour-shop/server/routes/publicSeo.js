const router = require("express").Router();
const Product = require("../models/Product");
const SeoSetting = require("../models/SeoSetting");

const xmlEscape = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getSiteBaseUrl = async () => {
  const setting = await SeoSetting.findOne({ key: "default" });
  const fromSetting = setting?.canonicalBaseUrl?.trim();
  return (
    fromSetting ||
    process.env.SITE_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
};

router.get("/sitemap.xml", async (req, res) => {
  try {
    const siteBase = await getSiteBaseUrl();
    const products = await Product.find(
      {},
      { _id: 1, category: 1, updatedAt: 1 },
    )
      .sort({ updatedAt: -1 })
      .limit(30000);

    const categories = [
      ...new Set(products.map((item) => item.category).filter(Boolean)),
    ];

    const staticUrls = [
      {
        loc: `${siteBase}/`,
        changefreq: "daily",
        priority: "1.0",
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${siteBase}/products`,
        changefreq: "daily",
        priority: "0.9",
        lastmod: new Date().toISOString(),
      },
    ];

    const categoryUrls = categories.map((category) => ({
      loc: `${siteBase}/products?category=${encodeURIComponent(category)}`,
      changefreq: "daily",
      priority: "0.7",
      lastmod: new Date().toISOString(),
    }));

    const productUrls = products.map((product) => ({
      loc: `${siteBase}/products/${product._id}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: (product.updatedAt || new Date()).toISOString(),
    }));

    const urls = [...staticUrls, ...categoryUrls, ...productUrls];

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (item) =>
            `  <url>\n` +
            `    <loc>${xmlEscape(item.loc)}</loc>\n` +
            `    <lastmod>${item.lastmod}</lastmod>\n` +
            `    <changefreq>${item.changefreq}</changefreq>\n` +
            `    <priority>${item.priority}</priority>\n` +
            `  </url>`,
        )
        .join("\n") +
      `\n</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.status(200).send(xml);
  } catch (err) {
    return res.status(500).send("Failed to generate sitemap.xml");
  }
});

router.get("/robots.txt", async (req, res) => {
  try {
    const siteBase = await getSiteBaseUrl();
    const setting = await SeoSetting.findOne({ key: "default" });
    const globalNoIndex = Boolean(setting?.noindex);

    const lines = [
      "User-agent: *",
      globalNoIndex ? "Disallow: /" : "Allow: /",
      "Disallow: /admin",
      "Disallow: /checkout",
      "Disallow: /dashboard",
      "Disallow: /cart",
      `Sitemap: ${siteBase}/sitemap.xml`,
    ];

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(200).send(lines.join("\n"));
  } catch (err) {
    return res.status(500).send("Failed to generate robots.txt");
  }
});

module.exports = router;
