import type { PageTheme } from "@/lib/page-theme";
import type { PrPage } from "@/lib/pr-page";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

export interface CountdownToast {
  kind: "countdown";
  prKey: string;
  /** `Date.now()` when the countdown started. */
  startedAt: number;
  durationMs: number;
}

export interface NoticeToast {
  kind: "notice";
  text: string;
  startedAt: number;
}

export interface PageState {
  /** The page's own light/dark theme; our UI uses the opposite. */
  pageTheme: PageTheme;
  /** The committed `window.location.href` the state was computed from. Not an arrival identity (hash and query changes update it); see `arrivalKey`. */
  href: string;
  /** The PR page currently shown, or null on any other page. */
  page: PrPage | null;
  settings: Settings;
  /** False until the first read from extension storage has completed. */
  settingsLoaded: boolean;
  /** Whether the flip modifier (⌥) is currently held. */
  flipHeld: boolean;
  /** The toast currently shown, or null when the floating pill is shown instead. */
  toast: CountdownToast | NoticeToast | null;
  /** CSS `bottom` (px) for the pill and toasts; raised when another extension's widget occupies the corner. */
  cornerBottom: number;
}

export interface PageStore {
  get(): PageState;
  set(patch: Partial<PageState>): void;
  subscribe(listener: () => void): () => void;
}

export function createPageStore(initial: Partial<PageState> = {}): PageStore {
  let state: PageState = {
    pageTheme: "light",
    href: "",
    page: null,
    settings: DEFAULT_SETTINGS,
    settingsLoaded: false,
    flipHeld: false,
    toast: null,
    cornerBottom: 16,
    ...initial,
  };
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set(patch) {
      const next = { ...state, ...patch };
      const changed = (Object.keys(patch) as (keyof PageState)[]).some(
        (key) => !Object.is(state[key], next[key]),
      );
      if (!changed) return;
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
