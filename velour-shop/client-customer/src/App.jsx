import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import { seoAPI } from "./services/api";

function upsertMeta(name, content, attr = "name") {
  if (!content) return;
  const selector = `meta[${attr}="${name}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function applyCanonical(url) {
  if (!url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function SeoRuntime() {
  const [seoSettings, setSeoSettings] = useState(null);
  const location = useLocation();

  useEffect(() => {
    seoAPI
      .getSettings()
      .then(({ data }) => setSeoSettings(data))
      .catch(() => setSeoSettings(null));
  }, []);

  useEffect(() => {
    if (!seoSettings) return;

    const pathname = location.pathname;
    const pageTitle =
      pathname === "/"
        ? seoSettings.homepageTitle || seoSettings.siteTitle
        : pathname.startsWith("/products")
          ? seoSettings.productsTitle || seoSettings.siteTitle
          : seoSettings.siteTitle;

    document.title = pageTitle || "VELOUR Shop";

    upsertMeta("description", seoSettings.metaDescription);
    upsertMeta("keywords", seoSettings.metaKeywords);

    const robots = seoSettings.noindex
      ? "noindex,nofollow"
      : seoSettings.robots;
    upsertMeta("robots", robots || "index,follow");

    upsertMeta("og:title", seoSettings.ogTitle || pageTitle, "property");
    upsertMeta(
      "og:description",
      seoSettings.ogDescription || seoSettings.metaDescription,
      "property",
    );
    upsertMeta("og:image", seoSettings.ogImage || "", "property");
    upsertMeta("og:type", "website", "property");

    upsertMeta(
      "twitter:card",
      seoSettings.twitterCard || "summary_large_image",
    );
    upsertMeta("twitter:site", seoSettings.twitterSite || "");
    upsertMeta("twitter:title", seoSettings.ogTitle || pageTitle);
    upsertMeta(
      "twitter:description",
      seoSettings.ogDescription || seoSettings.metaDescription,
    );
    upsertMeta("twitter:image", seoSettings.ogImage || "");

    const canonicalBase = (seoSettings.canonicalBaseUrl || "").replace(
      /\/$/,
      "",
    );
    applyCanonical(
      canonicalBase ? `${canonicalBase}${pathname}` : window.location.href,
    );
  }, [location.pathname, seoSettings]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SeoRuntime />
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
