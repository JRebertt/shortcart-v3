import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@shortcart-v3/database"
import { env } from "@shortcart-v3/env";
 
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }), 
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL
})