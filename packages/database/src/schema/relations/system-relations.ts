import { relations } from 'drizzle-orm';
import { apiKeys, analyticsEvents } from '../tables/system-tables';
import { organizations } from '../tables/user-tables';

// Relações de chaves de API
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));

// Relações de eventos de analytics
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [analyticsEvents.organizationId],
    references: [organizations.id],
  }),
}));

