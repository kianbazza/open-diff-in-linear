import type { ContentScriptContext } from "#imports";
import { cornerBottom } from "@/lib/corner";
import type { PageStore } from "./store";

export const GRAPHITE_TOAST_SELECTOR = "#graphite-view-in-cursor-toast";

export function startCornerOffset(
  ctx: ContentScriptContext,
  store: PageStore,
): void {
  let observed: Element | null = null;
  let scheduled = false;

  const resizeObserver = new ResizeObserver(() => schedule());

  const measure = () => {
    const widget = document.querySelector(GRAPHITE_TOAST_SELECTOR);
    store.set({
      cornerBottom: cornerBottom(
        widget ? widget.getBoundingClientRect() : null,
        window.innerHeight,
      ),
    });
    if (widget !== observed) {
      if (observed) resizeObserver.unobserve(observed);
      if (widget) resizeObserver.observe(widget);
      observed = widget;
    }
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (!ctx.isValid) return;
      measure();
    });
  };

  const mutationObserver = new MutationObserver(() => schedule());
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  ctx.addEventListener(window, "resize", schedule);
  ctx.onInvalidated(() => {
    mutationObserver.disconnect();
    resizeObserver.disconnect();
  });
  measure();
}
