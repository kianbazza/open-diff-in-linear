import { describe, expect, it } from "vitest";
import {
  cancellationKey,
  isCancelled,
  type KeyValueStore,
  markCancelled,
} from "./cancellation";

function fakeStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("sticky cancellation", () => {
  it("is false by default and true after marking", () => {
    const store = fakeStore();
    expect(isCancelled("acme/app#1", store)).toBe(false);
    markCancelled("acme/app#1", store);
    expect(isCancelled("acme/app#1", store)).toBe(true);
  });
  it("uses a key per PR", () => {
    const store = fakeStore();
    markCancelled("acme/app#1", store);
    expect(isCancelled("acme/app#2", store)).toBe(false);
    expect(cancellationKey("x")).toBe("odil:cancelled:x");
  });
  it("handles throwing stores", () => {
    const store: KeyValueStore = {
      getItem() {
        throw new Error();
      },
      setItem() {
        throw new Error();
      },
    };
    expect(isCancelled("x", store)).toBe(false);
    expect(() => markCancelled("x", store)).not.toThrow();
  });
  it("handles SecurityError from storage methods", () => {
    const securityError = () => {
      throw new DOMException("Storage is unavailable", "SecurityError");
    };
    const store: KeyValueStore = {
      getItem: securityError,
      setItem: securityError,
    };
    expect(isCancelled("x", store)).toBe(false);
    expect(() => markCancelled("x", store)).not.toThrow();
  });
  it("tolerates the default storage being unreadable", () => {
    // Reading `window.sessionStorage` throws in this environment.
    expect(isCancelled("x")).toBe(false);
    expect(() => markCancelled("x")).not.toThrow();
  });
});
