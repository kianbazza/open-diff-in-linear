import { describe, expect, it } from "vitest";
import {
  ARRIVAL_SUPPRESSION_KEY,
  ARRIVAL_SUPPRESSION_TTL_MS,
  type SuppressionStore,
  suppressNextArrival,
  takeArrivalSuppression,
} from "./arrival-suppression";

function createStore(): SuppressionStore {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

describe("arrival suppression", () => {
  it("returns false when nothing is set", () => {
    expect(takeArrivalSuppression(100, createStore())).toBe(false);
  });

  it("consumes a set flag once", () => {
    const store = createStore();
    suppressNextArrival(100, store);
    expect(takeArrivalSuppression(100, store)).toBe(true);
    expect(takeArrivalSuppression(100, store)).toBe(false);
  });

  it("removes an expired flag", () => {
    const store = createStore();
    suppressNextArrival(100, store);
    expect(
      takeArrivalSuppression(100 + ARRIVAL_SUPPRESSION_TTL_MS + 1, store),
    ).toBe(false);
    expect(store.getItem(ARRIVAL_SUPPRESSION_KEY)).toBeNull();
  });

  it("rejects a garbage value", () => {
    const store = createStore();
    store.setItem(ARRIVAL_SUPPRESSION_KEY, "garbage");
    expect(takeArrivalSuppression(100, store)).toBe(false);
  });

  it("handles a throwing store", () => {
    const store: SuppressionStore = {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      },
      removeItem: () => {
        throw new Error("unavailable");
      },
    };
    expect(() => suppressNextArrival(100, store)).not.toThrow();
    expect(() => takeArrivalSuppression(100, store)).not.toThrow();
    expect(takeArrivalSuppression(100, store)).toBe(false);
  });

  it("handles unavailable sessionStorage without a store argument", () => {
    expect(() => suppressNextArrival()).not.toThrow();
    expect(() => takeArrivalSuppression()).not.toThrow();
    expect(takeArrivalSuppression()).toBe(false);
  });
});
