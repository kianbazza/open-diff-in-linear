export type HandoffKind = "click" | "automatic";

/** The subset of `window` the handoff needs, so tests can pass a fake. */
export interface NavigationWindow {
  location: { assign(url: string): void };
  open(url: string, target: string, features: string): unknown;
}

/**
 * Open a Linear URL. `linear://` always uses `location.assign` (the protocol handler
 * fires and the page stays). `https://` opens a new tab for a click and replaces the
 * page for an automatic handoff.
 */
export function openLinearUrl(
  url: string,
  kind: HandoffKind,
  win: NavigationWindow = window,
): void {
  if (url.startsWith("linear://") || kind === "automatic") {
    win.location.assign(url);
    return;
  }
  win.open(url, "_blank", "noopener");
}
