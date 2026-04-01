const express = require("express");
const router = express.Router();

const JwtUtil = require("../utils/JwtUtil");
const EmailUtil = require("../utils/EmailUtil");
const AdminDAO = require("../models/AdminDAO");
const CategoryDAO = require("../models/CategoryDAO");
const ProductDAO = require("../models/ProductDAO");
const OrderDAO = require("../models/OrderDAO");
const CustomerDAO = require("../models/CustomerDAO");
const Order = require("../models/Order");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({
      success: false,
      message: "Please input username and password",
    });
  }

  const admin = await AdminDAO.selectByUsernameAndPassword(username, password);
  if (!admin) {
    return res.json({
      success: false,
      message: "Incorrect username or password",
    });
  }

  const token = JwtUtil.genToken(username, password);
  return res.json({
    success: true,
    message: "Authentication successful",
    token,
  });
});

router.get("/token", JwtUtil.checkToken, (req, res) => {
  const authHeader = req.headers.authorization;
  const token =
    req.headers["x-access-token"] ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader);

  return res.json({ success: true, message: "Token is valid", token });
});

router.get("/categories", JwtUtil.checkToken, async (req, res) => {
  const categories = await CategoryDAO.selectAll();
  return res.json(categories);
});

router.post("/categories", JwtUtil.checkToken, async (req, res) => {
  const name = req.body.name;
  const category = { name };
  const result = await CategoryDAO.insert(category);
  return res.json(result);
});

router.put("/categories/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const name = req.body.name;
  const category = { _id, name };
  const result = await CategoryDAO.update(category);
  return res.json(result);
});

router.delete("/categories/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const result = await CategoryDAO.delete(_id);
  return res.json(result);
});

router.get("/products", JwtUtil.checkToken, async (req, res) => {
  let products = await ProductDAO.selectAll();

  const sizePage = 4;
  const noPages = Math.ceil(products.length / sizePage);
  let curPage = 1;
  if (req.query.page) curPage = parseInt(req.query.page, 10);

  const offset = (curPage - 1) * sizePage;
  products = products.slice(offset, offset + sizePage);

  const result = { products, noPages, curPage };
  return res.json(result);
});

router.post("/products", JwtUtil.checkToken, async (req, res) => {
  const name = req.body.name;
  const price = req.body.price;
  const cid = req.body.category;
  const image = req.body.image;
  const now = new Date().getTime();

  const category = await CategoryDAO.selectByID(cid);
  const product = { name, price, image, cdate: now, category };
  const result = await ProductDAO.insert(product);
  return res.json(result);
});

router.put("/products/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const name = req.body.name;
  const price = req.body.price;
  const cid = req.body.category;
  const image = req.body.image;
  const now = new Date().getTime();

  const category = await CategoryDAO.selectByID(cid);
  const product = { _id, name, price, image, cdate: now, category };
  const result = await ProductDAO.update(product);
  return res.json(result);
});

router.delete("/products/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const result = await ProductDAO.delete(_id);
  return res.json(result);
});

router.get("/orders", JwtUtil.checkToken, async (req, res) => {
  const orders = await OrderDAO.selectAll();
  return res.json(orders);
});

router.put("/orders/status/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const newStatus = req.body.status;
  const result = await OrderDAO.update(_id, newStatus);
  return res.json(result);
});

router.get("/customers", JwtUtil.checkToken, async (req, res) => {
  const customers = await CustomerDAO.selectAll();
  return res.json(customers);
});

router.get("/orders/customer/:cid", JwtUtil.checkToken, async (req, res) => {
  const _cid = req.params.cid;
  const legacyOrders = await OrderDAO.selectByCustID(_cid);
  const customer = await CustomerDAO.selectByID(_cid);

  const modernSourceOrders = await Order.find({ user: _cid }).sort({ createdAt: -1 }).lean();
  const modernOrders = modernSourceOrders.map((order) => {
    const mappedItems = Array.isArray(order.orderItems)
      ? order.orderItems.map((it) => ({
          product: {
            _id: typeof it.product === "object" ? it.product?._id : it.product,
            name: it.name,
            image: it.image,
            price: it.price,
          },
          quantity: typeof it.qty === "number" ? it.qty : it.quantity || 0,
        }))
      : [];

    return {
      ...order,
      cdate: order.createdAt ? new Date(order.createdAt).getTime() : null,
      total:
        typeof order.totalPrice === "number"
          ? order.totalPrice
          : typeof order.itemsPrice === "number"
            ? order.itemsPrice
            : 0,
      customer: {
        _id: _cid,
        name:
          order.shippingAddress?.name ||
          customer?.name ||
          customer?.username ||
          "",
        phone: order.shippingAddress?.phone || customer?.phone || "",
        email: customer?.email || "",
      },
      items: mappedItems,
    };
  });

  const orders = [...modernOrders, ...legacyOrders].sort((a, b) => {
    const timeA = new Date(a.cdate || a.createdAt || 0).getTime();
    const timeB = new Date(b.cdate || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return res.json(orders);
});

router.put("/customers/deactive/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const token = req.body.token;
  const result = await CustomerDAO.active(_id, token, 0);
  return res.json(result);
});

router.get("/customers/sendmail/:id", JwtUtil.checkToken, async (req, res) => {
  const _id = req.params.id;
  const cust = await CustomerDAO.selectByID(_id);
  if (cust) {
    try {
      const send = await EmailUtil.send(cust.email, cust._id, cust.token);
      if (send) {
        return res.json({ success: true, message: "Please check email" });
      }
      return res.json({ success: false, message: "Email failure" });
    } catch (err) {
      return res.json({ success: false, message: "Email failure" });
    }
  }
  return res.json({ success: false, message: "Not exists customer" });
});

module.exports = router;