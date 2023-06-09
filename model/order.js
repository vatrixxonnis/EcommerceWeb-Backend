const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const order = new Schema({
  _id: { type: String },
  customer_id: { type: ObjectId },
  order_date: { type: Date ,default: Date.now()},
  products: { type: Array },
  status: { type: String },
  shipping_address: { type: String },
  payment_method: { type: String },
  voucher_code: { type: String },
  created_at: { type: Date ,default: Date.now()},
  updated_at: { type: Date ,default: Date.now()},
});
module.exports = mongoose.model("order", order, "Order");
