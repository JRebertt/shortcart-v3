import { URL } from 'node:url'

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true;
  } catch {
    return false;
  }
}
