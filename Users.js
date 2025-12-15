const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    pass: { type: String, required: true }, // Should be hashed in a real app
    cart: { type: Array, default: [] }, // Persist buyer's cart
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);