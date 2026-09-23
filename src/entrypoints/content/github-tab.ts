import type { ContentScriptContext } from "#imports";
import { linearUrl } from "@/lib/linear-url";
import { pillPresentation } from "@/lib/pill";
import { handoff } from "./handoff";
import type { PageStore } from "./store";

export const GITHUB_TAB_ID = "odil-view-in-linear-tab";

/**
 * Keeps the "View in Linear" tab present in GitHub's PR tab bar whenever the store
 * says we are on a GitHub PR page, and removes it otherwise.
 */
export function startGithubTab(
  ctx: ContentScriptContext,
  store: PageStore,
  options: { beforeHandoff?: () => void } = {},
): void {
  function findTabTemplate(doc: Document): HTMLAnchorElement | null {
    const nav = doc.querySelector('nav[aria-label="Pull request navigation"]');
    if (nav) {
      const anchors = nav.querySelectorAll<HTMLAnchorElement>("a[href]");
      return anchors.item(anchors.length - 1);
    }

    const legacy = doc.querySelectorAll<HTMLAnchorElement>(
      '.tabnav-tabs a.tabnav-tab[href*="/pull/"]',
    );
    return legacy.item(legacy.length - 1);
  }

  function buildTab(template: HTMLAnchorElement): HTMLAnchorElement {
    const tab = template.cloneNode(true) as HTMLAnchorElement;
    for (const attribute of Array.from(tab.attributes)) {
      if (
        attribute.name === "id" ||
        attribute.name === "aria-current" ||
        attribute.name === "aria-selected" ||
        attribute.name.startsWith("data-")
      ) {
        tab.removeAttribute(attribute.name);
      }
    }
    tab.className = Array.from(tab.classList)
      .filter((name) => !name.toLowerCase().includes("selected"))
      .join(" ");
    tab.replaceChildren();
    tab.id = GITHUB_TAB_ID;
    tab.target = "_blank";
    tab.rel = "noopener";
    tab.dataset.odil = "tab";
    return tab;
  }

  function sync(): void {
    const state = store.get();
    const existing = document.getElementById(GITHUB_TAB_ID);
    if (state.page === null || state.page.host !== "github") {
      if (existing) existing.remove();
      return;
    }

    const { label, target } = pillPresentation(
      state.settings.openTarget,
      state.flipHeld,
    );
    const href = linearUrl(state.page, target);
    if (existing?.isConnected) {
      if (existing.textContent !== label) existing.textContent = label;
      if (existing.getAttribute("href") !== href)
        existing.setAttribute("href", href);
      return;
    }

    const template = findTabTemplate(document);
    if (template === null) return;

    const tab = buildTab(template);
    tab.textContent = label;
    tab.href = href;
    template.after(tab);
  }

  const unsubscribe = store.subscribe(sync);
  ctx.onInvalidated(unsubscribe);
  ctx.addEventListener(document, "click", handleTabClick, { capture: true });
  ctx.addEventListener(
    document,
    "auxclick",
    (event) => {
      if (event.button === 1) handleTabClick(event);
    },
    { capture: true },
  );
  ctx.onInvalidated(() => document.getElementById(GITHUB_TAB_ID)?.remove());

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!ctx.isValid) return;
        sync();
      });
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  ctx.onInvalidated(() => observer.disconnect());

  sync();

  function handleTabClick(event: MouseEvent): void {
    const target = event.target;
    if (
      !(target instanceof Element) ||
      target.closest(`#${GITHUB_TAB_ID}`) === null
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    options.beforeHandoff?.();
    const { page, settings } = store.get();
    if (page === null) return;
    void handoff(
      page,
      pillPresentation(settings.openTarget, event.altKey).target,
      "click",
    );
  }
}
