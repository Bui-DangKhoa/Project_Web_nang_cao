const router = require("express").Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const SeoSetting = require("../models/SeoSetting");
const { protect, authorizeRoles } = require("../middleware/auth");

const buildDateRange = (range = "month") => {
  const now = new Date();
  let startDate;

  if (range === "day") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

const getOrCreateSeoSetting = async () => {
  let setting = await SeoSetting.findOne({ key: "default" });
  if (!setting) {
    setting = await SeoSetting.create({ key: "default" });
  }
  return setting;
};

// GET /api/admin/dashboard?range=day|month|year
router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    const range = req.query.range || "month";
    const { startDate, endDate } = buildDateRange(range);

    const revenuePipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $nin: ["Đã hủy"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: range === "year" ? "%Y-%m" : "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const [
      revenueSeries,
      topProducts,
      lowStockProducts,
      totalUsers,
      totalOrders,
      totalProducts,
      activeCoupons,
    ] = await Promise.all([
      Order.aggregate(revenuePipeline),
      Order.aggregate([
        { $unwind: "$orderItems" },
        {
          $group: {
            _id: "$orderItems.product",
            soldQty: { $sum: "$orderItems.qty" },
            revenue: {
              $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] },
            },
          },
        },
        { $sort: { soldQty: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            soldQty: 1,
            revenue: 1,
            name: "$product.name",
            price: "$product.price",
            category: "$product.category",
          },
        },
      ]),
      Product.find(
        { countInStock: { $lte: 5 } },
        { name: 1, countInStock: 1, category: 1 },
      )
        .sort({ countInStock: 1 })
        .limit(20),
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Coupon.countDocuments({ isActive: true }),
    ]);

    const rangeOrderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      totalUsers,
      totalOrders,
      totalProducts,
      activeCoupons,
      revenueInRange: revenueSeries.reduce(
        (sum, point) => sum + (point.revenue || 0),
        0,
      ),
    };

    return res.json({
      range,
      from: startDate,
      to: endDate,
      summary,
      charts: {
        revenueSeries,
        orderStatus: rangeOrderStats,
      },
      topProducts,
      lowStockProducts,
    });
  },
);

// GET /api/admin/orders
router.get(
  "/orders",
  protect,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.json(orders);
  },
);

// PATCH /api/admin/orders/:id/status
router.patch(
  "/orders/:id/status",
  protect,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    const { status } = req.body;
    const allowed = [
      "Chờ xác nhận",
      "Đang xử lý",
      "Đang vận chuyển",
      "Đã giao",
      "Đã hủy",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    order.status = status;
    order.isDelivered = status === "Đã giao";
    if (order.isDelivered) order.deliveredAt = new Date();
    await order.save();

    return res.json({
      message: "Cập nhật trạng thái đơn hàng thành công",
      order,
    });
  },
);

// GET /api/admin/inventory
router.get(
  "/inventory",
  protect,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    const products = await Product.find(
      {},
      {
        name: 1,
        category: 1,
        countInStock: 1,
        soldCount: 1,
        variants: 1,
      },
    ).sort({ countInStock: 1 });

    return res.json(products);
  },
);

// GET /api/admin/seo
router.get(
  "/seo",
  protect,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    const setting = await getOrCreateSeoSetting();
    return res.json(setting);
  },
);

// PUT /api/admin/seo
router.put(
  "/seo",
  protect,
  authorizeRoles("admin", "staff"),
  async (req, res) => {
    const allowedFields = [
      "siteTitle",
      "metaDescription",
      "metaKeywords",
      "canonicalBaseUrl",
      "robots",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "twitterCard",
      "twitterSite",
      "homepageTitle",
      "productsTitle",
      "noindex",
    ];

    const payload = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    });

    let setting = await getOrCreateSeoSetting();
    Object.assign(setting, payload);
    await setting.save();

    return res.json({ message: "Đã cập nhật SEO settings", setting });
  },
);

module.exports = router;
