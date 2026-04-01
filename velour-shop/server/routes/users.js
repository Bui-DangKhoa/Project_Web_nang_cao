const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { Customer } = require('../models/Models');
const Address = require('../models/Address');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
    const customer = await Customer.findById(req.user._id);
    if (customer) {
        const addresses = await Address.find({ user: customer._id })
            .sort({ isDefault: -1, updatedAt: -1 })
            .lean();

        res.json({
            _id: customer._id,
            username: customer.username,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            role: 'user',
            addresses: addresses.map((addr) => ({
                _id: addr._id,
                label: addr.label || '',
                name: addr.name || customer.name || '',
                street: addr.street || '',
                city: addr.city || '',
                district: addr.district || '',
                phone: addr.phone || customer.phone || '',
                isDefault: !!addr.isDefault,
            })),
            wishlist: Array.isArray(customer.wishlist) ? customer.wishlist : [],
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    const customer = await Customer.findById(req.user._id);
    if (customer) {
        customer.name = req.body.name || customer.name;
        customer.email = (req.body.email || customer.email || '').toLowerCase();
        customer.phone = req.body.phone || customer.phone;
        if (req.body.password) {
            customer.password = await bcrypt.hash(req.body.password, 12);
        }
        const updatedCustomer = await customer.save();

        let addresses = await Address.find({ user: updatedCustomer._id }).sort({ isDefault: -1, updatedAt: -1 });
        if (Array.isArray(req.body.addresses)) {
            await Address.deleteMany({ user: updatedCustomer._id });
            const payload = req.body.addresses
                .map((addr, idx) => ({
                    user: updatedCustomer._id,
                    label: (addr?.label || '').trim() || (idx === 0 ? 'Mặc định' : `Địa chỉ ${idx + 1}`),
                    name: (addr?.name || updatedCustomer.name || '').trim(),
                    street: (addr?.street || '').trim(),
                    city: (addr?.city || 'Hồ Chí Minh').trim(),
                    district: (addr?.district || '').trim(),
                    phone: (addr?.phone || updatedCustomer.phone || '').trim(),
                    isDefault: idx === 0,
                }))
                .filter((addr) => addr.street || addr.phone);

            if (payload.length) {
                await Address.insertMany(payload);
            }
            addresses = await Address.find({ user: updatedCustomer._id }).sort({ isDefault: -1, updatedAt: -1 });
        }

        res.json({
            _id: updatedCustomer._id,
            username: updatedCustomer.username,
            name: updatedCustomer.name,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone,
            role: 'user',
            addresses: addresses.map((addr) => ({
                _id: addr._id,
                label: addr.label || '',
                name: addr.name || updatedCustomer.name || '',
                street: addr.street || '',
                city: addr.city || '',
                district: addr.district || '',
                phone: addr.phone || updatedCustomer.phone || '',
                isDefault: !!addr.isDefault,
            })),
            wishlist: Array.isArray(updatedCustomer.wishlist) ? updatedCustomer.wishlist : [],
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// GET /api/users/cart
router.get('/cart', protect, async (req, res) => {
    const customer = await Customer.findById(req.user._id)
        .populate('cart.product', 'name price category images countInStock')
        .lean();

    if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const cart = Array.isArray(customer.cart)
        ? customer.cart.filter((item) => item?.product)
        : [];

    return res.json({ cart });
});

// PUT /api/users/cart
router.put('/cart', protect, async (req, res) => {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const inputCart = Array.isArray(req.body?.cart) ? req.body.cart : [];
    const productIds = inputCart
        .map((item) => item?.product)
        .filter(Boolean);

    const existingProducts = await Product.find({ _id: { $in: productIds } }).select('_id').lean();
    const validProductIds = new Set(existingProducts.map((p) => String(p._id)));

    customer.cart = inputCart
        .filter((item) => item?.product && validProductIds.has(String(item.product)))
        .map((item) => ({
            product: item.product,
            qty: Math.max(1, Number(item.qty) || 1),
            selectedSize: item.selectedSize || '',
            selectedColor: item.selectedColor || '',
        }));

    await customer.save();

    const updatedCustomer = await Customer.findById(req.user._id)
        .populate('cart.product', 'name price category images countInStock')
        .lean();

    return res.json({ cart: updatedCustomer?.cart || [] });
});

// GET /api/users/wishlist
router.get('/wishlist', protect, async (req, res) => {
    const customer = await Customer.findById(req.user._id).select('wishlist').lean();
    if (!customer) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    return res.json({ wishlist: Array.isArray(customer.wishlist) ? customer.wishlist : [] });
});

// POST /api/users/wishlist/:productId
router.post('/wishlist/:productId', protect, async (req, res) => {
    res.json({ message: 'Tính năng yêu thích chưa hỗ trợ cho customers', wishlist: [] });
});

// DELETE /api/users/wishlist/:productId
router.delete('/wishlist/:productId', protect, async (req, res) => {
    res.json({ message: 'Tính năng yêu thích chưa hỗ trợ cho customers', wishlist: [] });
});

module.exports = router;
