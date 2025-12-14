// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./Product');

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const withId = (p) => ({
  productId: p.productId || `${slugify(p.name)}-${Date.now().toString().slice(-4)}`,
  name: p.name,
  price: p.price,                 // per unit
  category: p.category,
  imageUrl: p.imageUrl || 'placeholder.jpg',
  description: p.description || '',
  varieties: p.varieties || [],
  isLiquid: !!p.isLiquid,
  unit: p.isLiquid ? 'L' : 'kg',
});

const initialProducts = [
  { name: 'Sona Masoori', price: 60, category: 'Rice', imageUrl: 'sona.jpg', isLiquid: false, varieties: ['Raw','Steam','Parboiled'] },
  { name: 'Ponni Rice', price: 55, category: 'Rice', imageUrl: 'ponni.jpg', isLiquid: false, varieties: ['Raw','Steamed'] },
  { name: 'Basmati', price: 170, category: 'Rice', imageUrl: 'basmati.jpg', isLiquid: false, varieties: ['Standard','Aged'] },
  { name: 'Toor Dal', price: 140, category: 'Dals', imageUrl: 'toor.jpg', isLiquid: false },
  { name: 'Turmeric Powder', price: 300, category: 'Spices', imageUrl: 'turmeric.jpg', isLiquid: false },
  { name: 'Gingelly (Sesame) Oil', price: 420, category: 'Oils', imageUrl: 'gingelly.jpg', isLiquid: true },
  { name: 'Coconut Oil', price: 260, category: 'Oils', imageUrl: 'coconut.jpg', isLiquid: true },
  { name: 'Himalayan Pink Salt', price: 40, category: 'Salts', imageUrl: 'pink-salt.jpg', isLiquid: false },
  { name: 'Wheat Flour (Atta)', price: 35, category: 'Flours', imageUrl: 'atta.jpg', isLiquid: false },
  { name: 'Coffee Powder', price: 450, category: 'Beverages', imageUrl: 'coffee.jpg', isLiquid: false },
].map(withId);

(async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const del = await Product.deleteMany({});
    console.log(`🧹 Cleared ${del.deletedCount} products`);

    const docs = await Product.insertMany(initialProducts, { ordered: true });
    console.log(`✅ Inserted ${docs.length} products`);
    docs.forEach(d => console.log(` • ${d.name} [${d.productId}] — ₹${d.price}/${d.unit} (${d.category})`));
  } catch (e) {
    console.error('❌ Seed error:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Mongo closed');
  }
})();
