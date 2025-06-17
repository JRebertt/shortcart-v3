import { pgEnum } from 'drizzle-orm/pg-core';

// Enums relacionados a API e segurança
export const apiKeyScopeEnum = pgEnum('api_key_scope', ['read', 'write', 'admin']);

