import { pgEnum } from 'drizzle-orm/pg-core';

// Enums relacionados a usuários e organizações
export const userRoleEnum = pgEnum('user_role', ['admin', 'owner', 'member']);
export const organizationPlanEnum = pgEnum('organization_plan', ['free', 'starter', 'pro', 'enterprise']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'in_review', 'approved', 'rejected', 'expired']);

