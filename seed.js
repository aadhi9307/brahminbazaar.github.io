const mongoose = require('mongoose');
const Product = require('./Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const initialProducts = [
    // Note: These fields match the 'Product.js' schema (name and price)
    { name: 'Sona Masoori Rice', category: 'Rice', price: 60, isLiquid: false, varieties: ['1kg', '5kg', '10kg'], imageUrl: 'rice_sona.jpg', tagline: 'Premium aged rice.' },
    { name: 'Toor Dal (Split Pigeon Pea)', category: 'Dals', price: 140, isLiquid: false, varieties: ['500g', '1kg'], imageUrl: 'dal_toor.jpg', tagline: 'Rich protein source.' },
    { name: 'Sesame Oil', category: 'Oils', price: 350, isLiquid: true, varieties: ['500ml', '1L'], imageUrl: 'oil_sesame.jpg', tagline: 'Cold-pressed, traditional oil.' },
    { name: 'Red Chilli Powder', category: 'Spices', price: 200, isLiquid: false, varieties: ['100g', '250g'], imageUrl: 'chilli.jpg', tagline: 'Spicy and aromatic.' },
];

async function seedDB() {
    if (!MONGODB_URI) {
        console.error("FATAL: MONGODB_URI not set in .env file.");
        return;
    }
    
    try {
        // CORRECTED: Removed { useNewUrlParser: true, useUnifiedTopology: true }
        await mongoose.connect(MONGODB_URI); 
        console.log('MongoDB connected for seeding.');

        // Clear existing data
        await Product.deleteMany({});
        
        // Insert new data
        await Product.insertMany(initialProducts);
        console.log(`Successfully seeded ${initialProducts.length} products.`);

    } catch (err) {
        console.error('Error seeding the database:', err.message);
    } finally {
        // IMPORTANT: Close the connection after seeding is done
        await mongoose.connection.close();
        console.log('Connection closed.');
    }
}

seedDB();