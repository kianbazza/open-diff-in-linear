import type { PrPage } from "@/lib/pr-page";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

export interface PageState {
  /** The committed `window.location.href` the state was computed from. Identifies an arrival. */
  href: string;
  /** The PR page currently shown, or null on any other page. */
  page: PrPage | null;
  settings: Settings;
  /** False until the first read from extension storage has completed. */
  settingsLoaded: boolean;
  /** Whether the flip modifier (⌥) is currently held. */
  flipHeld: boolean;
}

export interface PageStore {
  get(): PageState;
  set(patch: Partial<PageState>): void;
  subscribe(listener: () => void): () => void;
}

export function createPageStore(initial: Partial<PageState> = {}): PageStore {
  let state: PageState = {
    href: "",
    page: null,
    settings: DEFAULT_SETTINGS,
    settingsLoaded: false,
    flipHeld: false,
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
