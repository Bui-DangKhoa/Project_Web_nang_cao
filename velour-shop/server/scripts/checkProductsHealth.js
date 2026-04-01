require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const docs = await Product.find({}).lean();
  const issues = [];

  for (const p of docs) {
    if (p.badge != null && typeof p.badge !== 'string') {
      issues.push(['badge', String(p._id), typeof p.badge]);
    }
    if (p.rating != null && typeof p.rating !== 'number') {
      issues.push(['rating', String(p._id), typeof p.rating]);
    }
    if (p.category != null && typeof p.category !== 'string') {
      issues.push(['category', String(p._id), typeof p.category]);
    }
    if (p.images != null && !Array.isArray(p.images)) {
      issues.push(['images', String(p._id), typeof p.images]);
    }
    if (Array.isArray(p.images) && p.images.some((i) => typeof i !== 'string')) {
      issues.push(['images-item', String(p._id), 'mixed']);
    }
  }

  console.log('products', docs.length);
  console.log('issues', issues.length);
  console.log('issue sample', issues.slice(0, 20));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
