const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/product.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [electronics, clothing, books, food, sports, other]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', productController.getProduct);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, category]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, books, food, sports, other]
 *               stock:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticate, requireAdmin, [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required (max 200 chars)'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['electronics', 'clothing', 'books', 'food', 'sports', 'other']).withMessage('Invalid category'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  validate
], productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', authenticate, requireAdmin, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

/**
 * @swagger
 * /api/products/validate/{productId}:
 *   get:
 *     summary: Validate product and check stock (internal)
 *     tags: [Internal]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Validation result
 */
router.get('/validate/:productId', productController.validateProduct);

/**
 * @swagger
 * /api/products/stock/{productId}:
 *   patch:
 *     summary: Update product stock (internal - used by Order Service)
 *     tags: [Internal]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               action:
 *                 type: string
 *                 enum: [decrease, increase]
 *     responses:
 *       200:
 *         description: Stock updated
 */
router.patch('/stock/:productId', productController.updateStock);

module.exports = router;
