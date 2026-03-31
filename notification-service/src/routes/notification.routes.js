const express = require('express');
const { body } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a notification (internal - used by other services)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, userEmail, userName, type, title, message]
 *             properties:
 *               userId:
 *                 type: string
 *               userEmail:
 *                 type: string
 *               userName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [order_confirmation, order_status_update, order_cancelled, welcome, general]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               metadata:
 *                 type: object
 *               channel:
 *                 type: string
 *                 enum: [in-app, email, both]
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('userEmail').isEmail().withMessage('Valid email is required'),
  body('userName').notEmpty().withMessage('User name is required'),
  body('type').isIn(['order_confirmation', 'order_status_update', 'order_cancelled', 'welcome', 'general']),
  body('title').notEmpty().isLength({ max: 200 }),
  body('message').notEmpty().isLength({ max: 2000 }),
  validate
], notificationController.createNotification);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, notificationController.getUserNotifications);

/**
 * @swagger
 * /api/notifications/order/{orderId}:
 *   get:
 *     summary: Get notifications for an order (communicates with Order Service)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order notifications
 */
router.get('/order/:orderId', authenticate, notificationController.getOrderNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.patch('/:id/read', authenticate, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
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
 *         description: Notification deleted
 */
router.delete('/:id', authenticate, notificationController.deleteNotification);

module.exports = router;
