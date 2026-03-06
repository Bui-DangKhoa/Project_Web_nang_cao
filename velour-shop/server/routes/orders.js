const router = require('express').Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// POST /api/orders
router.post('/', protect, async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, totalPrice } = req.body;
    if (!orderItems?.length) return res.status(400).json({ message: 'Không có sản phẩm' });

    const order = await Order.create({
        user: req.user._id,
        orderItems, shippingAddress, paymentMethod,
        itemsPrice, totalPrice,
    });
    res.status(201).json(order);
});

// GET /api/orders/myorders
router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json(orders);
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) res.json(order);
    else res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
});

module.exports = router;
