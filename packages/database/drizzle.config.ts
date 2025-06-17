import { defineConfig } from 'drizzle-kit'
import { env } from '@shortcart-v3/env'


export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schema: './src/schema/*',
  out: './src/migrations',
  casing: 'snake_case',
})
