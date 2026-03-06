const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            addresses: user.addresses,
            wishlist: user.wishlist,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
});

// POST /api/users/wishlist/:productId
router.post('/wishlist/:productId', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user.wishlist.includes(req.params.productId)) {
        user.wishlist.push(req.params.productId);
        await user.save();
    }
    res.json({ message: 'Đã thêm vào yêu thích', wishlist: user.wishlist });
});

// DELETE /api/users/wishlist/:productId
router.delete('/wishlist/:productId', protect, async (req, res) => {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.json({ message: 'Đã xóa khỏi yêu thích', wishlist: user.wishlist });
});

module.exports = router;
