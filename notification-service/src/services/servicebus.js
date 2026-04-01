const { ServiceBusClient } = require('@azure/service-bus');
const Notification = require('../models/notification.model');

const QUEUE_NAME = 'order-notifications';
let client = null;
let receiver = null;

async function startConsumer() {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
  if (!connectionString) {
    console.log('SERVICE_BUS_CONNECTION_STRING not set, Service Bus consumer disabled');
    console.log('Notifications will be received via HTTP endpoint instead');
    return false;
  }

  try {
    client = new ServiceBusClient(connectionString);
    receiver = client.createReceiver(QUEUE_NAME);

    receiver.subscribe({
      processMessage: async (message) => {
        try {
          const { eventType, userId, userEmail, userName, orderId, totalAmount, status } = message.body;

          let title, notifMessage, type;
          switch (eventType) {
            case 'order_confirmed':
              type = 'order_confirmation';
              title = 'Order Confirmed';
              notifMessage = `Your order #${orderId} has been confirmed. Total: $${totalAmount?.toFixed(2)}`;
              break;
            case 'order_status_updated':
              type = 'order_status_update';
              title = 'Order Status Updated';
              notifMessage = `Your order #${orderId} status has been updated to: ${status}`;
              break;
            case 'order_cancelled':
              type = 'order_cancelled';
              title = 'Order Cancelled';
              notifMessage = `Your order #${orderId} has been cancelled.`;
              break;
            default:
              type = eventType;
              title = 'Notification';
              notifMessage = message.body.message || 'You have a new notification';
          }

          await Notification.create({
            userId,
            userEmail,
            userName,
            type,
            title,
            message: notifMessage,
            metadata: { orderId, totalAmount, status },
            channel: 'in-app'
          });

          console.log(`[Service Bus] Processed ${eventType} notification for user ${userId}`);
        } catch (err) {
          console.error('[Service Bus] Failed to process message:', err.message);
        }
      },
      processError: async (args) => {
        console.error('[Service Bus] Receiver error:', args.error.message);
      }
    });

    console.log('Service Bus consumer started (queue: order-notifications)');
    return true;
  } catch (err) {
    console.error('Service Bus consumer initialization failed:', err.message);
    return false;
  }
}

async function stopConsumer() {
  if (receiver) await receiver.close();
  if (client) await client.close();
}

module.exports = { startConsumer, stopConsumer };
