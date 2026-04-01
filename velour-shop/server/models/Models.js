const mongoose = require("mongoose");

// Schemas
const AdminSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String,
  },
  { versionKey: false },
);

const CategorySchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
  },
  { versionKey: false },
);

const CustomerSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    password: String,
    name: String,
    phone: String,
    email: String,
    active: Number,
    token: String,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: { type: Number, default: 1 },
        selectedSize: { type: String, default: "" },
        selectedColor: { type: String, default: "" },
      },
    ],
  },
  { versionKey: false },
);

const ProductSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    image: String,
    cdate: Number,
    category: CategorySchema,
  },
  { versionKey: false },
);

const ItemSchema = new mongoose.Schema(
  {
    product: ProductSchema,
    quantity: Number,
  },
  { versionKey: false, _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    cdate: Number,
    total: Number,
    status: String,
    customer: CustomerSchema,
    items: [ItemSchema],
  },
  { versionKey: false },
);

// Models (guarded to avoid OverwriteModelError)
const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
const Product =
  mongoose.models.LegacyProduct ||
  mongoose.model("LegacyProduct", ProductSchema, "products");
const Order =
  mongoose.models.LegacyOrder ||
  mongoose.model("LegacyOrder", OrderSchema, "orders");

module.exports = { Admin, Category, Customer, Product, Order };