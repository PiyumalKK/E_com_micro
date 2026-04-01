const { ServiceBusClient } = require('@azure/service-bus');

let sender = null;
let client = null;
const QUEUE_NAME = 'order-notifications';

async function initServiceBus() {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
  if (!connectionString) {
    console.log('SERVICE_BUS_CONNECTION_STRING not set, using HTTP fallback for notifications');
    return false;
  }

  try {
    client = new ServiceBusClient(connectionString);
    sender = client.createSender(QUEUE_NAME);
    console.log('Service Bus sender initialized (queue: order-notifications)');
    return true;
  } catch (err) {
    console.error('Service Bus initialization failed:', err.message);
    return false;
  }
}

function isServiceBusEnabled() {
  return sender !== null;
}

async function publishOrderEvent(eventType, data) {
  if (!sender) return false;

  try {
    await sender.sendMessages({
      body: {
        eventType,
        ...data,
        timestamp: new Date().toISOString()
      },
      contentType: 'application/json',
      subject: eventType
    });
    console.log(`[Service Bus] Published event: ${eventType}`);
    return true;
  } catch (err) {
    console.error('Failed to publish to Service Bus:', err.message);
    return false;
  }
}

async function closeServiceBus() {
  if (sender) await sender.close();
  if (client) await client.close();
}

module.exports = { initServiceBus, isServiceBusEnabled, publishOrderEvent, closeServiceBus };
