import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { createPageStore } from "./store";

describe("createPageStore", () => {
  it("starts with the default state", () => {
    expect(createPageStore().get()).toEqual({
      pageTheme: "light",
      href: "",
      page: null,
      settings: DEFAULT_SETTINGS,
      settingsLoaded: false,
      flipHeld: false,
      toast: null,
      cornerBottom: 16,
    });
  });

  it("notifies when state changes", () => {
    const store = createPageStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({ href: "https://github.com/a/b/pull/1" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify for identical values", () => {
    const store = createPageStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({ href: "" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const store = createPageStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set({ href: "https://github.com/a/b/pull/1" });
    expect(listener).not.toHaveBeenCalled();
  });
});
