# VELOUR Shop — Hướng Dẫn Chạy Dự Án

## 📁 Cấu Trúc Project
```
velour-shop/
├── server/         ← Backend Node.js + Express + MongoDB
└── client/         ← Frontend React + Vite
```

## ⚡ Bước 1: Cài Đặt Dependencies

Mở terminal và chạy lần lượt:

```bash
# Backend
cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\server"
npm install

# Frontend
cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client"
npm install
```

## 🔧 Bước 2: Cấu Hình MongoDB

File `server/.env` đã được tạo sẵn với:
```
MONGO_URI=mongodb://localhost:27017/velour-shop
JWT_SECRET=velour_secret_key_2026
PORT=5000
```

> **Yêu cầu**: MongoDB phải đang chạy trên máy (cổng 27017).  
> Hoặc đổi `MONGO_URI` sang MongoDB Atlas (cloud).

## 🚀 Bước 3: Chạy Dự Án

Mở **2 terminal** riêng biệt:

**Terminal 1 — Backend:**
```bash
cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\server"
npm run dev
```
→ Server chạy tại `http://localhost:5000`

**Terminal 2 — Frontend:**  
```bash
cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client"
npm run dev
```
→ App chạy tại `http://localhost:5173`

## 🌐 API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký | ❌ |
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| GET | `/api/products` | Danh sách SP | ❌ |
| GET | `/api/products/:id` | Chi tiết SP | ❌ |
| POST | `/api/products/:id/reviews` | Đánh giá | ✅ |
| POST | `/api/orders` | Tạo đơn hàng | ✅ |
| GET | `/api/orders/myorders` | Đơn của tôi | ✅ |

## 📦 Thêm Sản Phẩm Mẫu

Dùng Postman hoặc curl để POST lên `/api/products` (cần có token admin), ví dụ:
```json
{
  "name": "Áo Hoodie Premium",
  "description": "Áo hoodie cao cấp, chất liệu cotton thoáng mát",
  "price": 850000,
  "originalPrice": 1200000,
  "category": "Áo",
  "colors": ["#2d2d2d", "#4a6fa5"],
  "sizes": ["S", "M", "L", "XL"],
  "countInStock": 50,
  "badge": "Hot"
}
```
