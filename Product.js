// Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      match: [/^[a-z0-9-]+$/i, 'Product ID must contain letters, numbers, or dashes only'],
    },
    name: { type: String, required: true, trim: true, minlength: 2 },
    price: { type: Number, required: true, min: [0, 'Price must be >= 0'] }, // per unit
    category: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: 'placeholder.jpg' },
    description: { type: String, trim: true, default: 'High quality essential product.' },
    varieties: { type: [String], default: [] },
    isLiquid: { type: Boolean, default: false },     // true -> per L, false -> per kg
    unit: { type: String, enum: ['kg', 'L'] },       // kept in sync with isLiquid
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.productId || ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// keep unit <-> isLiquid consistent (Mongoose 8: no next())
productSchema.pre('validate', function () {
  if (this.isLiquid === true && this.unit !== 'L') this.unit = 'L';
  if (this.isLiquid === false && this.unit !== 'kg') this.unit = 'kg';
});

// auto productId from name if missing
productSchema.pre('validate', function () {
  if (!this.productId && this.name) {
    const base = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    this.productId = `${base}-${Date.now().toString().slice(-4)}`;
  }
});

productSchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('Product', productSchema);
