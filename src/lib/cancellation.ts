/** The subset of `Storage` sticky cancellation needs, so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function cancellationKey(prKey: string): string {
  return `odil:cancelled:${prKey}`;
}

export function isCancelled(prKey: string, store?: KeyValueStore): boolean {
  try {
    const target = store ?? window.sessionStorage;
    return target.getItem(cancellationKey(prKey)) === "1";
  } catch {
    return false;
  }
}

export function markCancelled(prKey: string, store?: KeyValueStore): void {
  try {
    const target = store ?? window.sessionStorage;
    target.setItem(cancellationKey(prKey), "1");
  } catch {
    // Storage may be unavailable in sandboxed frames.
  }
}
