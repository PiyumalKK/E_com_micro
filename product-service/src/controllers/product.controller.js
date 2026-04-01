const Product = require('../models/product.model');
const { getCache, setCache, invalidateCache } = require('../services/cache');
const { uploadImage, deleteImage, isBlobStorageEnabled } = require('../services/blobstorage');

// Upload product image to Azure Blob Storage
exports.uploadProductImage = async (req, res) => {
  try {
    if (!isBlobStorageEnabled()) {
      return res.status(503).json({ error: 'Image upload service not available' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const imageUrl = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    console.error('Image upload error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;
    const product = await Product.create({
      name, description, price, category, stock, imageUrl,
      createdBy: req.user.userId
    });
    // Invalidate product list cache
    await invalidateCache('products:*');
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

    // Try cache first
    const cacheKey = `products:${category || 'all'}:${search || 'none'}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

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

    const result = {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    // Cache the result
    await setCache(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    // Try cache first
    const cacheKey = `product:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = { product };
    await setCache(cacheKey, result, 300);

    res.json(result);
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
    // Invalidate cache
    await invalidateCache('products:*');
    await invalidateCache(`product:${req.params.id}`);
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
    // Invalidate cache
    await invalidateCache('products:*');
    await invalidateCache(`product:${req.params.id}`);
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
    // Invalidate cache on stock change
    await invalidateCache('products:*');
    await invalidateCache(`product:${productId}`);
    res.json({ message: 'Stock updated', product: { id: product._id, stock: product.stock } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
};
