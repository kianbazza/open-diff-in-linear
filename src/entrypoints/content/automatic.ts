import type { ContentScriptContext } from "#imports";
import { arrivalKey, decideArrival } from "@/lib/automatic";
import { isCancelled, markCancelled } from "@/lib/cancellation";
import { linearUrl } from "@/lib/linear-url";
import { openLinearUrl } from "@/lib/navigate";
import { type PrPage, prKey } from "@/lib/pr-page";
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

  function clearCountdown(): void {
    if (countdownHandle !== null) {
      clearTimeout(countdownHandle);
      countdownHandle = null;
    }
    if (store.get().toast) store.set({ toast: null });
  }

  function fire(page: PrPage): void {
    countdownHandle = null;
    store.set({ toast: null });
    const url = linearUrl(page, store.get().settings.openTarget);
    openLinearUrl(url, "automatic");
  }

  function decide(page: PrPage) {
    return decideArrival({
      page,
      settings: store.get().settings,
      cancelled: isCancelled(prKey(page)),
    });
  }

  function handleArrival(page: PrPage): void {
    if (document.visibilityState !== "visible") {
      clearCountdown();
      waitingForVisible = true;
      return;
    }
    waitingForVisible = false;
    const decision = decide(page);
    clearCountdown();
    if (decision.kind === "none") return;
    const durationMs = decision.seconds * 1000;
    store.set({
      toast: {
        kind: "countdown",
        prKey: prKey(page),
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
    if (decide(page).kind === "none") clearCountdown();
  }

  function onStoreChange(): void {
    const { page, settingsLoaded } = store.get();
    if (!settingsLoaded) return;
    if (page === null) {
      clearCountdown();
      lastArrivalKey = null;
      waitingForVisible = false;
      return;
    }
    const key = arrivalKey(page);
    if (key === lastArrivalKey) {
      recheckCountdown();
      return;
    }
    lastArrivalKey = key;
    handleArrival(page);
  }

  function onVisibilityChange(): void {
    if (document.visibilityState !== "visible") {
      if (store.get().toast?.kind === "countdown") {
        clearCountdown();
        waitingForVisible = true;
      }
      return;
    }
    if (waitingForVisible) {
      waitingForVisible = false;
      const page = store.get().page;
      if (page !== null) handleArrival(page);
    }
  }

  function cancel(): void {
    const toast = store.get().toast;
    if (toast?.kind !== "countdown") return;
    markCancelled(toast.prKey);
    clearCountdown();
  }

  const unsubscribe = store.subscribe(onStoreChange);
  ctx.onInvalidated(unsubscribe);
  ctx.addEventListener(document, "visibilitychange", onVisibilityChange);
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
