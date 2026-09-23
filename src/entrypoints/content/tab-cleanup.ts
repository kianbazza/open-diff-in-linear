import type { ContentScriptContext } from "#imports";
import { suppressNextArrival } from "@/lib/arrival-suppression";
import { sendMessage } from "@/lib/messages";
import {
  CLEANUP_ARM_TIMEOUT_MS,
  CLEANUP_SETTLE_MS,
  decideCleanup,
} from "@/lib/tab-cleanup";

export interface TabCleanup {
  /** Start watching for the handoff to be confirmed (focus loss). Replaces any previous arming. */
  arm(): void;
  disarm(): void;
}

export function createTabCleanup(ctx: ContentScriptContext): TabCleanup {
  let generation = 0;
  let armHandle: number | null = null;
  let settleHandle: number | null = null;

  function disarm(): void {
    generation += 1;
    if (armHandle !== null) {
      clearTimeout(armHandle);
      armHandle = null;
    }
    if (settleHandle !== null) {
      clearTimeout(settleHandle);
      settleHandle = null;
    }
  }

  function arm(): void {
    disarm();
    const mine = generation;
    armHandle = ctx.setTimeout(() => {
      if (mine === generation) disarm();
    }, CLEANUP_ARM_TIMEOUT_MS);
    const armedHref = window.location.href;
    ctx.addEventListener(window, "blur", () => {
      if (mine !== generation || settleHandle !== null) return;
      if (armHandle !== null) {
        clearTimeout(armHandle);
        armHandle = null;
      }
      settleHandle = ctx.setTimeout(() => {
        if (mine !== generation) return;
        if (window.location.href !== armedHref) {
          disarm();
          return;
        }
        const action = decideCleanup({
          historyLength: window.history.length,
          hasFocus: document.hasFocus(),
        });
        disarm();
        if (action === "back") {
          suppressNextArrival();
          window.history.back();
        } else if (action === "close")
          void sendMessage({ type: "close-tab" }, undefined);
      }, CLEANUP_SETTLE_MS);
    });
  }

  return { arm, disarm };
}
