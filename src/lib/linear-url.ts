import type { PrPage } from "./pr-page";

export type OpenTarget = "desktop" | "web" | "linear-decides";

/** `review/<owner>/<repo>/pull/<number>` plus `/changes` when the view is `changes`. No leading slash. */
export function linearReviewPath(page: PrPage): string {
  const path = `review/${page.owner}/${page.repo}/pull/${page.number}`;
  return page.view === "changes" ? `${path}/changes` : path;
}

/** The URL to hand a PR page off to for the given open target. */
export function linearUrl(page: PrPage, target: OpenTarget): string {
  const path = linearReviewPath(page);
  switch (target) {
    case "desktop":
      return `linear://${path}`;
    case "web":
      return `https://linear.app/${path}?noRedirect=1`;
    case "linear-decides":
      return `https://linear.app/${path}`;
    default: {
      const exhaustive: never = target;
      throw new Error(`Unknown open target: ${String(exhaustive)}`);
    }
  }
}

/** The other open target for the flip modifier: desktop ⇄ web. `linear-decides` has no opposite → null. */
export function flippedTarget(target: OpenTarget): OpenTarget | null {
  switch (target) {
    case "desktop":
      return "web";
    case "web":
      return "desktop";
    case "linear-decides":
      return null;
    default: {
      const exhaustive: never = target;
      throw new Error(`Unknown open target: ${String(exhaustive)}`);
    }
  }
}
