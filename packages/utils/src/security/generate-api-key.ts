export function generateApiKey(): string {
  const prefix = 'ck_';
  const key = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  return prefix + key;
}
