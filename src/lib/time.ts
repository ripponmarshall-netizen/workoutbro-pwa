export function nowIso(): string {
  return new Date().toISOString();
}

export function minutesSince(value: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
}

export function computeRetryAt(attempt: number): string {
  const seconds = Math.min(1800, Math.max(5, Math.round(5 * Math.pow(2, attempt))));
  return new Date(Date.now() + seconds * 1000).toISOString();
}
