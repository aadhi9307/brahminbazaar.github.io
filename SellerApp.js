const mongoose = require('mongoose');

const sellerAppSchema = new mongoose.Schema({
    sellerName: { type: String, required: true },
    sellerEmail: { type: String, required: true },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true, min: 0 },
    productDescription: { type: String },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SellerApp', sellerAppSchema);