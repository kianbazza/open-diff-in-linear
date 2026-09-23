import type { ContentScriptContext } from "#imports";
import { parsePrPage } from "@/lib/pr-page";
import { readSettings, sanitizeSettings, settingsItem } from "@/lib/settings";
import type { PageStore } from "./store";

/**
 * Keeps the page store in sync with the world: the current URL (including GitHub's
 * in-page navigation), the settings, and whether ⌥ is held.
 */
export function startPageController(
  ctx: ContentScriptContext,
  store: PageStore,
): void {
  const syncLocation = () => {
    const href = window.location.href;
    if (href !== store.get().href) store.set({ href, page: parsePrPage(href) });
  };
  syncLocation();
  ctx.addEventListener(window, "wxt:locationchange", () => {
    ctx.setTimeout(syncLocation, 0);
  });

  let watched = false;
  const unwatch = settingsItem.watch((next) => {
    watched = true;
    store.set({ settings: sanitizeSettings(next), settingsLoaded: true });
  });
  ctx.onInvalidated(unwatch);
  void readSettings().then(
    (settings) =>
      store.set(
        watched ? { settingsLoaded: true } : { settings, settingsLoaded: true },
      ),
    () => store.set({ settingsLoaded: true }),
  );

  ctx.addEventListener(
    window,
    "keydown",
    (event) => {
      if (event.key === "Alt") store.set({ flipHeld: true });
    },
    { capture: true },
  );
  ctx.addEventListener(
    window,
    "keyup",
    (event) => {
      if (event.key === "Alt") store.set({ flipHeld: false });
    },
    { capture: true },
  );
  ctx.addEventListener(
    window,
    "blur",
    (event) => {
      if (event.target === window) store.set({ flipHeld: false });
    },
    { capture: true },
  );
}
