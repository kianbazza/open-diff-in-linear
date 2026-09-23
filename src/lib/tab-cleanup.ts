export type CleanupAction = "back" | "close" | "none";

export interface CleanupInput {
  /** `window.history.length` at decision time. */
  historyLength: number;
  /** `document.hasFocus()` re-checked after the settle delay. */
  hasFocus: boolean;
}

/** What to do with the leftover tab once a desktop handoff is confirmed. */
export function decideCleanup(input: CleanupInput): CleanupAction {
  if (input.hasFocus) return "none";
  if (input.historyLength > 1) return "back";
  return "close";
}

export const CLEANUP_ARM_TIMEOUT_MS = 10_000;
export const CLEANUP_SETTLE_MS = 1_500;
