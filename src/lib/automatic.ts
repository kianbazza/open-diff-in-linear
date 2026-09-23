import { type PrPage, prKey } from "./pr-page";
import {
  type CountdownSeconds,
  isOrgAllowlisted,
  type Settings,
} from "./settings";

export type ArrivalDecision =
  | { kind: "countdown"; seconds: CountdownSeconds }
  | { kind: "loop-breaker" }
  | {
      kind: "none";
      reason:
        | "manual-mode"
        | "not-allowlisted"
        | "view-not-handed-off"
        | "cancelled"
        | "flip-modifier";
    };

export interface ArrivalInput {
  page: PrPage;
  settings: Settings;
  /** Sticky cancellation already recorded for this PR in this tab. */
  cancelled: boolean;
  skipRequested: boolean;
  recentlyHandedOff: boolean;
}

/**
 * Identity of an arrival: the same PR page in the same view. URL hash and query
 * changes (comment permalinks, file anchors, `?diff=split`) are not new arrivals.
 * `${page.host}:${prKey(page)}:${page.view}`
 */
export function arrivalKey(page: PrPage): string {
  return `${page.host}:${prKey(page)}:${page.view}`;
}

/** Decide what automatic mode does on arrival at a PR page. Checks run in the order of the `reason` union. */
export function decideArrival(input: ArrivalInput): ArrivalDecision {
  if (input.settings.mode !== "automatic")
    return { kind: "none", reason: "manual-mode" };
  if (!isOrgAllowlisted(input.settings.allowlist, input.page.owner))
    return { kind: "none", reason: "not-allowlisted" };
  if (input.page.view !== "overview" && input.page.view !== "changes")
    return { kind: "none", reason: "view-not-handed-off" };
  if (input.cancelled) return { kind: "none", reason: "cancelled" };
  if (input.skipRequested) return { kind: "none", reason: "flip-modifier" };
  if (input.recentlyHandedOff) return { kind: "loop-breaker" };
  return { kind: "countdown", seconds: input.settings.countdownSeconds };
}
