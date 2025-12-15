const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Corresponds to the 'title' in the frontend
    name: { 
        type: String,
        required: true,
        trim: true
    },
    
    // Corresponds to 'basePrice' in the frontend
    price: { 
        type: Number,
        required: true,
        min: 0 
    },
    
    // Category (e.g., 'Rice', 'Dals')
    category: {
        type: String,
        required: true,
        trim: true
    },
    
    // Image URL (corresponds to 'img' in the frontend)
    imageUrl: {
        type: String,
        default: 'placeholder.jpg'
    },
    
    // Variety options (corresponds to 'varieties')
    varieties: {
        type: [String],
        default: [] 
    },
    
    // Flag for liquid items (corresponds to 'isLiquid' or similar logic)
    isLiquid: {
        type: Boolean,
        default: false
    },
    
    // Description or tagline
    tagline: { 
        type: String, 
        default: 'Freshly sourced and premium quality.' 
    }
    
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);