export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `wb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createIdempotencyKey(prefix = 'mut'): string {
  return `${prefix}_${createId()}`;
}

export function buildRequestHash(value: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value)))).slice(0, 48);
}
