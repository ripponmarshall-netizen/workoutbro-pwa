function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/** Short tap — 10 ms */
export function hapticLight(): void {
  vibrate(10);
}

/** Medium tap — 30 ms */
export function hapticMedium(): void {
  vibrate(30);
}

/** Heavy double-pulse — [50, 30, 50] */
export function hapticHeavy(): void {
  vibrate([50, 30, 50]);
}

/** Success pattern — [50, 50, 100] */
export function hapticSuccess(): void {
  vibrate([50, 50, 100]);
}
