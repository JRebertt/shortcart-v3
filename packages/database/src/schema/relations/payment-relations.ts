import { relations } from 'drizzle-orm';
import { payments, gatewayConfigs } from '../tables/payment-tables';
import { organizations } from '../tables/user-tables';
import { customers, products } from '../tables/product-tables';

// Relações de pagamentos
export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [payments.productId],
    references: [products.id],
  }),
}));

// Relações de configurações de gateway
export const gatewayConfigsRelations = relations(gatewayConfigs, ({ one }) => ({
  organization: one(organizations, {
    fields: [gatewayConfigs.organizationId],
    references: [organizations.id],
  }),
}));

