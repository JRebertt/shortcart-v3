import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'


export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLOUDFLARE_ACCOUNT_ID:z.string(),
    CLOUDFLARE_ACCESS_KEY:z.string(),
    CLOUDFLARE_SECRET_KEY:z.string(),
    // PORT: z.coerce.number().default(3333),
    // JWT_SECRET: z.string(),
    // GOOGLE_CLIENT_ID: z.string(),
    // GOOGLE_CLIENT_SECRET: z.string(),
    // GITHUB_OAUTH_CLIENT_ID: z.string(),
    // GITHUB_OAUTH_CLIENT_SECRET: z.string(),
    // GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string().url(),
    // AES_ENCRYPTION_KEY: z.string(),
  },
  client: {
    // NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    // NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    // NEXT_PUBLIC_API_URL: z.string().url(),
    // NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  },
  shared: {
    // VERCEL_ENV: z.enum(['production', 'development', 'preview']).optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY: process.env.CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_KEY: process.env.CLOUDFLARE_SECRET_KEY,
    // PORT: process.env.PORT,
    // JWT_SECRET: process.env.JWT_SECRET,
    // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    // NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    // NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL,
    // GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    // GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    // AES_ENCRYPTION_KEY: process.env.AES_ENCRYPTION_KEY,
    // GITHUB_OAUTH_CLIENT_REDIRECT_URI:
    //   process.env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
    // VERCEL_ENV: process.env.VERCEL_ENV,
  },
  emptyStringAsUndefined: true,
})