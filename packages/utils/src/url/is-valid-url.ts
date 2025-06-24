import { z } from 'zod'

export const isValidUrlSchema = z.string().url()

// Uso
export function isValidUrl(url: string): boolean {
  const result = isValidUrlSchema.safeParse(url)
  return result.success
}
