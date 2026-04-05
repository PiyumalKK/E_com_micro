const axios = require('axios');
const Order = require('../models/order.model');
const { isServiceBusEnabled, publishOrderEvent } = require('../services/servicebus');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Create a new order - communicates with User Service and Product Service
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user.userId;

    // 1. Validate user with User Service (inter-service communication)
    let userData;
    try {
      const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/validate/${userId}`);
      userData = userResponse.data.user;
    } catch (error) {
      return res.status(400).json({ error: 'User validation failed. User may not exist.' });
    }

    // 2. Validate products and calculate total with Product Service (inter-service communication)
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      try {
        const productResponse = await axios.get(
          `${PRODUCT_SERVICE_URL}/api/products/validate/${item.productId}?quantity=${item.quantity}`
        );
        const productData = productResponse.data;

        if (!productData.valid || !productData.hasStock) {
          return res.status(400).json({
            error: `Product ${item.productId} is not available or insufficient stock`
          });
        }

        orderItems.push({
          productId: productData.product.id,
          productName: productData.product.name,
          quantity: item.quantity,
          price: productData.product.price
        });
        totalAmount += productData.product.price * item.quantity;
      } catch (error) {
        return res.status(400).json({ error: `Failed to validate product ${item.productId}` });
      }
    }

    // 3. Create the order
    const order = await Order.create({
      userId,
      userName: userData.name,
      userEmail: userData.email,
      items: orderItems,
      totalAmount,
      shippingAddress,
      status: 'confirmed'
    });

    // 4. Update stock in Product Service (inter-service communication)
    for (const item of orderItems) {
      try {
        await axios.patch(`${PRODUCT_SERVICE_URL}/api/products/stock/${item.productId}`, {
          quantity: item.quantity,
          action: 'decrease'
        });
      } catch (error) {
        console.error(`Failed to update stock for product ${item.productId}:`, error.message);
      }
    }

    // 5. Send notification via Service Bus (or HTTP fallback)
    try {
      if (isServiceBusEnabled()) {
        await publishOrderEvent('order_confirmed', {
          userId,
          userEmail: userData.email,
          userName: userData.name,
          orderId: order._id,
          totalAmount
        });
      } else {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
          userId,
          userEmail: userData.email,
          userName: userData.name,
          type: 'order_confirmation',
          title: 'Order Confirmed',
          message: `Your order #${order._id} has been confirmed. Total: $${totalAmount.toFixed(2)}`,
          metadata: { orderId: order._id, totalAmount }
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error.message);
      // Non-critical - order still succeeds
    }

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json({ orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    // Users can only see their own orders, admins can see all
    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Notify user about status change via Service Bus (or HTTP fallback)
    try {
      if (isServiceBusEnabled()) {
        await publishOrderEvent('order_status_updated', {
          userId: order.userId,
          userEmail: order.userEmail,
          userName: order.userName,
          orderId: order._id,
          status
        });
      } else {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
          userId: order.userId,
          userEmail: order.userEmail,
          userName: order.userName,
          type: 'order_status_update',
          title: 'Order Status Updated',
          message: `Your order #${order._id} status has been updated to: ${status}`,
          metadata: { orderId: order._id, status }
        });
      }
    } catch (error) {
      console.error('Failed to send status notification:', error.message);
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel shipped or delivered orders' });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock
    for (const item of order.items) {
      try {
        await axios.patch(`${PRODUCT_SERVICE_URL}/api/products/stock/${item.productId}`, {
          quantity: item.quantity,
          action: 'increase'
        });
      } catch (error) {
        console.error(`Failed to restore stock for ${item.productId}:`, error.message);
      }
    }

    // Send cancellation notification via Service Bus (or HTTP fallback)
    try {
      if (isServiceBusEnabled()) {
        await publishOrderEvent('order_cancelled', {
          userId: order.userId,
          userEmail: order.userEmail,
          userName: order.userName,
          orderId: order._id
        });
      } else {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
          userId: order.userId,
          userEmail: order.userEmail,
          userName: order.userName,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Your order #${order._id} has been cancelled.`,
          metadata: { orderId: order._id }
        });
      }
    } catch (error) {
      console.error('Failed to send cancellation notification:', error.message);
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = String(status);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get order by ID (internal endpoint for Notification Service)
exports.getOrderInternal = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};
