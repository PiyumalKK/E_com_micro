const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: 2000
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'books', 'food', 'sports', 'other']
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
