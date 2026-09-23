/** The subset of `Storage` this needs, so tests can pass a fake. */
export interface SuppressionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const ARRIVAL_SUPPRESSION_KEY = "odil:suppress-next-arrival";
export const ARRIVAL_SUPPRESSION_TTL_MS = 5_000;

/** Tab cleanup is about to go back: the next arrival in this tab must not start a countdown. */
export function suppressNextArrival(
  now: number = Date.now(),
  store?: SuppressionStore,
): void {
  try {
    (store ?? window.sessionStorage).setItem(
      ARRIVAL_SUPPRESSION_KEY,
      String(now),
    );
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

/** Consume the flag. True when it was set within the TTL. The flag is removed either way. */
export function takeArrivalSuppression(
  now: number = Date.now(),
  store?: SuppressionStore,
): boolean {
  try {
    const resolvedStore = store ?? window.sessionStorage;
    const value = resolvedStore.getItem(ARRIVAL_SUPPRESSION_KEY);
    resolvedStore.removeItem(ARRIVAL_SUPPRESSION_KEY);
    const timestamp = Number(value);
    return (
      value !== null &&
      Number.isFinite(timestamp) &&
      now - timestamp <= ARRIVAL_SUPPRESSION_TTL_MS
    );
  } catch {
    return false;
  }
}
