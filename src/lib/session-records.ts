import { storage } from "#imports";

export const SKIP_TTL_MS = 15_000;
export const HANDOFF_TTL_MS = 60_000;

/** record key → timestamp (ms) the mark/record was made. */
type Records = Record<string, number>;

export const skipMarksItem = storage.defineItem<Records>("session:skipMarks", {
  fallback: {},
});
export const handoffsItem = storage.defineItem<Records>("session:handoffs", {
  fallback: {},
});

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

function pruned(
  records: Records,
  ttl: number,
  now: number,
): { records: Records; changed: boolean } {
  const copy = { ...records };
  let changed = false;
  for (const [key, timestamp] of Object.entries(copy)) {
    if (now - timestamp > ttl) {
      delete copy[key];
      changed = true;
    }
  }
  return { records: copy, changed };
}

/** Skip marks are per tab: the key is `${tabId}:${prKey}`. */
export function skipKey(tabId: number, prKey: string): string {
  return `${tabId}:${prKey}`;
}

export function markSkip(
  tabId: number,
  prKey: string,
  now = Date.now(),
): Promise<void> {
  return serial(async () => {
    const { records } = pruned(
      await skipMarksItem.getValue(),
      SKIP_TTL_MS,
      now,
    );
    records[skipKey(tabId, prKey)] = now;
    await skipMarksItem.setValue(records);
  });
}

/** True (and the mark is removed) when an unexpired mark exists for this tab and PR. */
export function consumeSkip(
  tabId: number,
  prKey: string,
  now = Date.now(),
): Promise<boolean> {
  return serial(async () => {
    const { records, changed: prunedAny } = pruned(
      await skipMarksItem.getValue(),
      SKIP_TTL_MS,
      now,
    );
    let changed = prunedAny;
    const key = skipKey(tabId, prKey);
    const timestamp = records[key];
    const consumed = timestamp !== undefined;
    if (consumed) {
      delete records[key];
      changed = true;
    }
    if (changed) await skipMarksItem.setValue(records);
    return consumed;
  });
}

export function recordHandoff(prKey: string, now = Date.now()): Promise<void> {
  return serial(async () => {
    const { records } = pruned(
      await handoffsItem.getValue(),
      HANDOFF_TTL_MS,
      now,
    );
    records[prKey] = now;
    await handoffsItem.setValue(records);
  });
}

export function wasRecentlyHandedOff(
  prKey: string,
  now = Date.now(),
): Promise<boolean> {
  return serial(async () => {
    const { records, changed } = pruned(
      await handoffsItem.getValue(),
      HANDOFF_TTL_MS,
      now,
    );
    if (changed) await handoffsItem.setValue(records);
    return records[prKey] !== undefined;
  });
}
