import { relations } from 'drizzle-orm';
import { webhooks, notificationTemplates } from '../tables/notification-tables';
import { organizations } from '../tables/user-tables';

// Relações de webhooks
export const webhooksRelations = relations(webhooks, ({ one }) => ({
  organization: one(organizations, {
    fields: [webhooks.organizationId],
    references: [organizations.id],
  }),
}));

// Relações de templates de notificação
export const notificationTemplatesRelations = relations(notificationTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [notificationTemplates.organizationId],
    references: [organizations.id],
  }),
}));

