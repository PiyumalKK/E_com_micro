const axios = require('axios');
const Notification = require('../models/notification.model');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

// Create notification (called by other services)
exports.createNotification = async (req, res) => {
  try {
    const { userId, userEmail, userName, type, title, message, metadata, channel } = req.body;

    const notification = await Notification.create({
      userId,
      userEmail,
      userName,
      type,
      title,
      message,
      metadata: metadata || {},
      channel: channel || 'in-app'
    });

    // Simulate sending email notification
    console.log(`[NOTIFICATION] Sending ${type} notification to ${userEmail}: ${title}`);

    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    console.error('Create notification error:', error.message);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Get user notifications (communicates with User Service to validate)
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate user with User Service (inter-service communication)
    try {
      await axios.get(`${USER_SERVICE_URL}/api/users/validate/${userId}`);
    } catch (error) {
      return res.status(401).json({ error: 'User validation failed' });
    }

    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { userId };
    if (unreadOnly === 'true') query.isRead = false;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications,
      unreadCount,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

// Get order details for notification enrichment (inter-service communication)
exports.getOrderNotifications = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order details from Order Service (inter-service communication)
    let orderData;
    try {
      const orderResponse = await axios.get(`${ORDER_SERVICE_URL}/api/orders/internal/${orderId}`);
      orderData = orderResponse.data.order;
    } catch (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get all notifications related to this order
    const notifications = await Notification.find({
      'metadata.orderId': orderId
    }).sort({ createdAt: -1 });

    res.json({
      orderId,
      orderStatus: orderData.status,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order notifications' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
