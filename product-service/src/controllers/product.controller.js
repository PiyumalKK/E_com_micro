const Product = require('../models/product.model');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;
    const product = await Product.create({
      name, description, price, category, stock, imageUrl,
      createdBy: req.user.userId
    });
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const allowedUpdates = ['name', 'description', 'price', 'category', 'stock', 'imageUrl', 'isActive'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Validate product and check stock (internal endpoint for Order Service)
exports.validateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.query;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ valid: false, error: 'Product not found or inactive' });
    }

    const hasStock = quantity ? product.stock >= parseInt(quantity) : true;

    res.json({
      valid: true,
      hasStock,
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock
      }
    });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
};

// Update stock (internal endpoint for Order Service)
exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, action } = req.body; // action: 'decrease' or 'increase'

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (action === 'decrease') {
      if (product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      product.stock -= quantity;
    } else if (action === 'increase') {
      product.stock += quantity;
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "decrease" or "increase"' });
    }

    await product.save();
    res.json({ message: 'Stock updated', product: { id: product._id, stock: product.stock } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
};
