const router = require('express').Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// GET /api/products?category=Áo&collection=Hot&page=1&limit=12&sort=price
router.get('/', async (req, res) => {
    const { category, collection, badge, sort, page = 1, limit = 12, search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (collection || badge) query.badge = collection || badge;
    if (search) query.name = { $regex: search, $options: 'i' };

    const sortObj = {
        'price_asc': { price: 1 },
        'price_desc': { price: -1 },
        'newest': { createdAt: -1 },
        'popular': { numReviews: -1 },
    }[sort] || { createdAt: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    res.json({ products, total, pages: Math.ceil(total / limit), page: Number(page) });
});

// GET /api/products/meta
router.get('/meta', async (_req, res) => {
    const [categories, collections] = await Promise.all([
        Product.distinct('category'),
        Product.distinct('badge'),
    ]);

    res.json({
        categories: categories.filter(Boolean),
        collections: collections.filter(Boolean),
    });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) res.json(product);
    else res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', protect, async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy' });

    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Đã thêm đánh giá' });
});

module.exports = router;
