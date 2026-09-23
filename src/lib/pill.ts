import { flippedTarget, type OpenTarget } from "./linear-url";

export interface PillPresentation {
  /** Text shown on the pill (and, later, on the GitHub tab). */
  label: string;
  /** The open target a click will use. */
  target: OpenTarget;
}

export const DEFAULT_PILL_LABEL = "View in Linear";

/**
 * What the pill shows and does given the configured open target and whether the
 * flip modifier (⌥) is held. With ⌥ held and a flipped target available, the pill
 * names the actual target it will open.
 */
export function pillPresentation(
  openTarget: OpenTarget,
  flipHeld: boolean,
): PillPresentation {
  const flipped = flipHeld ? flippedTarget(openTarget) : null;
  if (flipped !== null) {
    return {
      label: flipped === "desktop" ? "Open in desktop app" : "Open in web app",
      target: flipped,
    };
  }
  return { label: DEFAULT_PILL_LABEL, target: openTarget };
}
