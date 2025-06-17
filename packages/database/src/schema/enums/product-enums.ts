import { pgEnum } from 'drizzle-orm/pg-core';

// Enums relacionados a produtos e billing
export const productTypeEnum = pgEnum('product_type', ['digital', 'physical']);
export const billingTypeEnum = pgEnum('billing_type', ['one_time', 'subscription']);
export const subscriptionIntervalEnum = pgEnum('subscription_interval', ['monthly', 'yearly', 'lifetime']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'expired', 'past_due']);

