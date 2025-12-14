// Server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./Product');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- DB ----------
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('DB Connection Error:', err.message);
    process.exit(1);
  }
})();

// ---------- Helpers to match UI shapes ----------
// Map DB -> Buyer UI shape
const toBuyerShape = (p) => ({
  id: p.productId,                     // Buyer/admin UI uses 'id'
  category: p.category,
  title: p.name,                       // UI shows 'title'
  basePrice: p.price,                  // UI uses 'basePrice'
  img: p.imageUrl,
  varieties: Array.isArray(p.varieties) ? p.varieties : [],
  oil: !!p.isLiquid,                   // UI uses 'oil' (true -> per L)
});

// Map request payload from Admin UI-style to DB (when you wire it later)
const fromAdminPayload = (body) => {
  // Accept both current Admin terms and DB terms, just in case:
  const {
    id, productId, title, name,
    basePrice, price,
    category, img, imageUrl,
    varieties, oil, isLiquid,
    unit, description, active
  } = body;

  const pid = productId || id;
  return {
    productId: pid,
    name: name || title,
    price: (price ?? basePrice),
    category,
    imageUrl: imageUrl || img,
    varieties: Array.isArray(varieties) ? varieties : [],
    isLiquid: (typeof isLiquid === 'boolean' ? isLiquid : !!oil),
    unit: unit,            // pre-validate hook will correct if missing
    description,
    active,
  };
};

// ---------- ROUTES ----------

// 1) Buyer panel: list catalog in buyer shape (NO UI change)
app.get('/api/catalog', async (req, res) => {
  try {
    const docs = await Product.find({ active: true }).sort({ category: 1, name: 1 }).lean();
    res.json(docs.map(toBuyerShape));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching catalog', error: err.message });
  }
});

// 2) (Optional) Admin raw list in DB shape — for future wiring if you want
app.get('/api/admin/products', async (_req, res) => {
  try {
    const docs = await Product.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

// 3) (Optional) Admin add product — accepts either buyer/admin field names
app.post('/api/admin/products', async (req, res) => {
  try {
    const data = fromAdminPayload(req.body);
    if (!data.name || !data.category || typeof data.price !== 'number') {
      return res.status(400).json({ message: 'name, category and price are required' });
    }
    if (data.productId) {
      const exists = await Product.findOne({ productId: data.productId }).lean();
      if (exists) return res.status(400).json({ message: 'Product ID already exists' });
    }
    const doc = await Product.create(data);
    res.status(201).json({ message: 'Created', product: doc });
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// 4) (Optional) Admin update price/details — payload can be buyer/admin style
app.post('/api/admin/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = fromAdminPayload(req.body);
    // never allow changing productId using this route
    delete updates.productId;

    const updated = await Product.findOneAndUpdate({ productId }, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', product: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// 5) (Optional) Admin delete — mirrors local delete behavior if you wire it later
app.delete('/api/admin/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const del = await Product.findOneAndDelete({ productId });
    if (!del) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted', product: del });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`📡 Server on http://localhost:${PORT}`);
  console.log(`GET  /api/catalog                 → Buyer panel shape`);
  console.log(`GET  /api/admin/products          → Admin raw list (optional)`);
  console.log(`POST /api/admin/products          → Admin add (optional)`);
  console.log(`POST /api/admin/products/:id      → Admin update (optional)`);
  console.log(`DEL  /api/admin/products/:id      → Admin delete (optional)`);
});
