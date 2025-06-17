import { pgEnum } from 'drizzle-orm/pg-core';

// Enums relacionados a notificações e webhooks
export const notificationTypeEnum = pgEnum('notification_type', ['email', 'webhook', 'sms', 'push']);
export const webhookEventEnum = pgEnum('webhook_event', [
  'payment.created', 
  'payment.approved', 
  'payment.rejected', 
  'payment.cancelled',
  'subscription.created', 
  'subscription.renewed', 
  'subscription.cancelled', 
  'subscription.expired',
  'customer.created', 
  'customer.updated'
]);

