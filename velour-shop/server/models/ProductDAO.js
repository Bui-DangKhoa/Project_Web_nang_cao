require("../utils/MongooseUtil");
const Models = require("./Models");

const ProductDAO = {
  async selectAll() {
    const query = {};
    const products = await Models.Product.find(query).exec();
    return products;
  },

  async selectByID(_id) {
    const product = await Models.Product.findById(_id).exec();
    return product;
  },

  async insert(product) {
    const mongoose = require("mongoose");
    product._id = new mongoose.Types.ObjectId();
    const result = await Models.Product.create(product);
    return result;
  },

  async update(product) {
    const newvalues = {
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    };
    const result = await Models.Product.findByIdAndUpdate(product._id, newvalues, {
      new: true,
    });
    return result;
  },

  async delete(_id) {
    const result = await Models.Product.findByIdAndDelete(_id);
    return result;
  },
};

module.exports = ProductDAO;
