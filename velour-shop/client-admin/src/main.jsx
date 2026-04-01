import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App.js";
import "./index.css";

const defaultApiBaseUrl = import.meta.env.DEV
    ? "/api"
    : "https://velour-shop-server.onrender.com/api";
const configuredApiBaseUrl =
    import.meta.env.VITE_API_URL || defaultApiBaseUrl;

// Legacy class components still call axios with '/api/...'; set origin-level base URL.
const legacyAxiosBaseUrl = configuredApiBaseUrl.replace(/\/api\/?$/, "");
if (legacyAxiosBaseUrl) {
    axios.defaults.baseURL = legacyAxiosBaseUrl;
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
