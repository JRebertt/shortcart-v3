import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { paymentStatusEnum, paymentMethodEnum, gatewayProviderEnum } from '../enums';
import { organizations } from './user-tables';
import { customers, products } from './product-tables';

// Tabela de pagamentos
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('BRL').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  method: paymentMethodEnum('method').notNull(),
  gatewayProvider: gatewayProviderEnum('gateway_provider').notNull(),
  gatewayPaymentId: varchar('gateway_payment_id', { length: 255 }),
  gatewayResponse: jsonb('gateway_response'),
  paymentUrl: text('payment_url'),
  qrCode: text('qr_code'),
  barcode: text('barcode'),
  expiresAt: timestamp('expires_at'),
  paidAt: timestamp('paid_at'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de configurações de gateway
export const gatewayConfigs = pgTable('gateway_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  provider: gatewayProviderEnum('provider').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

