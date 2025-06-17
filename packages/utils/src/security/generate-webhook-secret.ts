export function generateWebhookSecret(): string {
  return Array.from({ length: 64 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}
