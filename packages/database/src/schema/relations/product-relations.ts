import { relations } from 'drizzle-orm';
import { products, customers, subscriptions } from '../tables/product-tables';
import { organizations } from '../tables/user-tables';

// Relações de produtos
export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  subscriptions: many(subscriptions),
}));

// Relações de clientes
export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  subscriptions: many(subscriptions),
}));

// Relações de assinaturas
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [subscriptions.productId],
    references: [products.id],
  }),
}));

