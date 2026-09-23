import type { ContentScriptContext } from "#imports";
import { arrivalKey, decideArrival } from "@/lib/automatic";
import { isCancelled, markCancelled } from "@/lib/cancellation";
import { sendMessage } from "@/lib/messages";
import { type PrPage, parsePrPage, prKey } from "@/lib/pr-page";
import { GITHUB_TAB_ID } from "./github-tab";
import { handoff } from "./handoff";
import type { PageStore } from "./store";

export interface AutomaticMode {
  /** Cancel the running countdown (if any) and remember the cancellation for this PR in this tab. */
  cancel(): void;
}

export function startAutomaticMode(
  ctx: ContentScriptContext,
  store: PageStore,
): AutomaticMode {
  let countdownHandle: number | null = null;
  let lastArrivalKey: string | null = null;
  let waitingForVisible = false;
  let arrivalGeneration = 0;
  /** The arrival whose background replies are outstanding; only honoured while it is the current arrival. */
  let pending: { key: string; generation: number } | null = null;

  function clearToast(): void {
    if (countdownHandle !== null) {
      clearTimeout(countdownHandle);
      countdownHandle = null;
    }
    if (store.get().toast) store.set({ toast: null });
  }

  function fire(page: PrPage): void {
    countdownHandle = null;
    store.set({ toast: null });
    const target = store.get().settings.openTarget;
    void handoff(page, target, "automatic");
  }

  function decide(page: PrPage) {
    return decideArrival({
      page,
      settings: store.get().settings,
      cancelled: isCancelled(prKey(page)),
      skipRequested: false,
      recentlyHandedOff: false,
    });
  }

  async function handleArrival(page: PrPage): Promise<void> {
    if (document.visibilityState !== "visible") {
      clearToast();
      waitingForVisible = true;
      return;
    }
    const mine = arrivalGeneration;
    waitingForVisible = false;
    clearToast();
    const key = prKey(page);
    const base = decide(page);
    if (base.kind !== "countdown") return;
    pending = { key, generation: mine };
    const [skipRequested, recentlyHandedOff] = await Promise.all([
      sendMessage({ type: "consume-skip", prKey: key }, false),
      sendMessage({ type: "was-recently-handed-off", prKey: key }, false),
    ]);
    if (pending?.generation === mine) pending = null;
    if (skipRequested) markCancelled(key);
    if (mine !== arrivalGeneration) return;
    if (document.visibilityState !== "visible") {
      waitingForVisible = true;
      return;
    }
    if (store.get().flipHeld) {
      markCancelled(key);
      return;
    }
    const decision = decideArrival({
      page,
      settings: store.get().settings,
      cancelled: isCancelled(key),
      skipRequested,
      recentlyHandedOff,
    });
    if (decision.kind === "none") {
      if (decision.reason === "flip-modifier") markCancelled(key);
      return;
    }
    if (decision.kind === "loop-breaker") {
      markCancelled(key);
      const notice = {
        kind: "notice" as const,
        text: `Back from Linear, staying on ${page.host === "github" ? "GitHub" : "Graphite"}`,
        startedAt: Date.now(),
      };
      store.set({ toast: notice });
      ctx.setTimeout(() => {
        const current = store.get().toast;
        if (
          current?.kind === "notice" &&
          current.startedAt === notice.startedAt
        )
          store.set({ toast: null });
      }, 4000);
      return;
    }
    const durationMs = decision.seconds * 1000;
    store.set({
      toast: {
        kind: "countdown",
        prKey: key,
        startedAt: Date.now(),
        durationMs,
      },
    });
    countdownHandle = ctx.setTimeout(() => fire(page), durationMs);
  }

  function recheckCountdown(): void {
    if (store.get().toast?.kind !== "countdown") return;
    const page = store.get().page;
    if (page === null) return;
    if (decide(page).kind === "none") clearToast();
  }

  function onStoreChange(): void {
    const { page, settingsLoaded } = store.get();
    if (!settingsLoaded) return;
    if (page === null) {
      arrivalGeneration += 1;
      clearToast();
      lastArrivalKey = null;
      waitingForVisible = false;
      return;
    }
    const key = arrivalKey(page);
    if (key === lastArrivalKey) {
      recheckCountdown();
      return;
    }
    arrivalGeneration += 1;
    lastArrivalKey = key;
    void handleArrival(page);
  }

  function onVisibilityChange(): void {
    if (document.visibilityState !== "visible") {
      if (store.get().toast?.kind === "countdown") {
        clearToast();
        waitingForVisible = true;
      }
      return;
    }
    if (waitingForVisible) {
      waitingForVisible = false;
      const page = store.get().page;
      if (page !== null) void handleArrival(page);
    }
  }

  function onDocumentClick(event: MouseEvent): void {
    if (
      !(
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        event.button === 0
      )
    )
      return;
    const anchor =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
    if (anchor === null || anchor.id === GITHUB_TAB_ID) return;
    const url = new URL(
      anchor.getAttribute("href") ?? "",
      window.location.href,
    );
    const target = parsePrPage(url);
    if (target === null) return;
    event.preventDefault();
    event.stopPropagation();
    void sendMessage(
      { type: "mark-skip", prKey: prKey(target) },
      undefined,
    ).then(() => window.location.assign(url.href));
  }

  function cancel(): void {
    const toast = store.get().toast;
    if (toast?.kind === "countdown") {
      markCancelled(toast.prKey);
      clearToast();
    } else if (pending !== null && pending.generation === arrivalGeneration) {
      markCancelled(pending.key);
    }
  }

  const unsubscribe = store.subscribe(onStoreChange);
  ctx.onInvalidated(unsubscribe);
  ctx.addEventListener(document, "visibilitychange", onVisibilityChange);
  ctx.addEventListener(document, "click", onDocumentClick, { capture: true });
  ctx.addEventListener(
    window,
    "keydown",
    (event) => {
      if (event.key === "Alt") cancel();
    },
    { capture: true },
  );
  onStoreChange();
  return { cancel };
}
