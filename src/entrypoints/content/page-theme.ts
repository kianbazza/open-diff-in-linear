import type { ContentScriptContext } from "#imports";
import { resolvePageTheme } from "@/lib/page-theme";
import type { PageStore } from "./store";

export function startPageTheme(
  ctx: ContentScriptContext,
  store: PageStore,
): void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let observedBody: HTMLElement | null = null;
  let scheduled = false;
  let trailing: ReturnType<typeof setTimeout> | undefined;
  const bodyObserver = new MutationObserver(schedule);
  const observer = new MutationObserver(schedule);

  function sync() {
    const backgrounds: string[] = [];
    if (document.body !== null)
      backgrounds.push(getComputedStyle(document.body).backgroundColor);
    backgrounds.push(
      getComputedStyle(document.documentElement).backgroundColor,
    );
    store.set({ pageTheme: resolvePageTheme(backgrounds, media.matches) });
    if (document.body !== observedBody) {
      bodyObserver.disconnect();
      if (document.body !== null)
        bodyObserver.observe(document.body, { attributes: true });
      observedBody = document.body;
    }
  }

  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!ctx.isValid) return;
        sync();
      });
    }
    clearTimeout(trailing);
    trailing = setTimeout(() => {
      if (ctx.isValid) sync();
    }, 350);
  }

  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
  });
  ctx.addEventListener(media, "change", schedule);
  ctx.onInvalidated(() => {
    observer.disconnect();
    bodyObserver.disconnect();
    clearTimeout(trailing);
  });
  sync();
}
