const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Models
const Product = require('./Product');
const User = require('./Users');
const Order = require('./Orders');
const SellerApp = require('./SellerApp');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/'))); 

// Database Connection
if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI not set. Check your .env file.");
    process.exit(1);
}

// CORRECTED: Removed { useNewUrlParser: true, useUnifiedTopology: true }
mongoose.connect(MONGODB_URI) 
    .then(() => console.log('MongoDB successfully connected.'))
    .catch(err => console.error('MongoDB connection error:', err));


// --- HELPER FUNCTION: Maps DB product to Frontend structure ---
const mapProductToFrontend = (dbProduct) => ({
    id: dbProduct._id,
    title: dbProduct.name, // maps name to title
    basePrice: dbProduct.price, // maps price to basePrice
    category: dbProduct.category,
    img: dbProduct.imageUrl, // maps imageUrl to img
    varieties: dbProduct.varieties,
    tagline: dbProduct.tagline,
    isLiquid: dbProduct.isLiquid
});


// --- 1. PRODUCT ROUTES (Admin/Buyer Access) ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        const frontendProducts = products.map(mapProductToFrontend);
        res.json(frontendProducts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProductData = {
            name: req.body.title,
            price: req.body.basePrice,
            category: req.body.category,
            imageUrl: req.body.img,
            varieties: req.body.varieties,
            tagline: req.body.tagline,
            isLiquid: req.body.isLiquid
        };
        const newProduct = new Product(newProductData);
        await newProduct.save();
        res.status(201).json(mapProductToFrontend(newProduct));
    } catch (error) {
        res.status(400).json({ message: 'Error adding product', error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id, 
            { price: req.body.basePrice, name: req.body.title, category: req.body.category },
            { new: true, runValidators: true }
        ).lean();

        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(mapProductToFrontend(product));
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const result = await Product.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Product not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

// --- 2. USER ROUTES (Buyer Account Management) ---

app.post('/api/users/register', async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        
        const newUser = new User({ ...req.body, cart: [] }); 
        await newUser.save();
        
        const { _id, name, email, phone, address } = newUser;
        res.status(201).json({ id: _id, name, email, phone, address, cart: [] });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, pass: req.body.pass });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const { _id, name, email, phone, address, cart } = user;
        res.json({ id: _id, name, email, phone, address, cart: cart || [] });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

app.post('/api/users/cart', async (req, res) => {
    try {
        const { userId, cart } = req.body;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        const updatedUser = await User.findByIdAndUpdate(userId, { cart: cart }, { new: true });
        
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'Cart updated successfully', cart: updatedUser.cart });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart', error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, { name: 1, email: 1, phone: 1, address: 1, date: 1, pass: 1, cart: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});


// --- 3. SELLER APPLICATION ROUTES (Admin Panel/Buyer Panel) ---

app.post('/api/sellers', async (req, res) => {
    try {
        const newApp = new SellerApp(req.body);
        await newApp.save();
        res.status(201).json(newApp);
    } catch (error) {
        res.status(400).json({ message: 'Error submitting application', error: error.message });
    }
});

app.get('/api/sellers', async (req, res) => {
    try {
        const sellers = await SellerApp.find({}).sort({ date: -1 });
        res.json(sellers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

app.delete('/api/sellers/:id', async (req, res) => {
    try {
        const result = await SellerApp.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Application not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting application', error: error.message });
    }
});

// --- 4. ORDER ROUTES (Admin Panel/Buyer Panel) ---

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        
        await User.findByIdAndUpdate(req.body.userId, { cart: [] }); 
        
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: 'Order placement failed', error: error.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Buyer Panel: http://localhost:${PORT}/index.html`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin.html`);
});