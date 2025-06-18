import { relations } from 'drizzle-orm';
import { users, organizations, organizationMembers, kycDocuments } from '../tables/user-tables';

// Relações de usuários
export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizations),
  organizationMembers: many(organizationMembers),
  kycDocumentsAsOwner: many(kycDocuments, {
    relationName: 'kyc_user',
  }),
  kycDocumentsAsReviewer: many(kycDocuments, {
    relationName: 'kyc_reviewer',
  }),
}));


// Relações de organizações
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
}));

// Relações de membros da organização
export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

// Relações de documentos KYC
export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
    relationName: 'kyc_user', // ✔️ nome único
  }),
  reviewer: one(users, {
    fields: [kycDocuments.reviewedBy],
    references: [users.id],
    relationName: 'kyc_reviewer', // ✔️ agora está correto
  }),
}));


