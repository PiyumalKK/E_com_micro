const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['order_confirmation', 'order_status_update', 'order_cancelled', 'welcome', 'general']
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  channel: {
    type: String,
    enum: ['in-app', 'email', 'both'],
    default: 'in-app'
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
