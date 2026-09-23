import { describe, expect, it } from "vitest";
import { decideCleanup } from "./tab-cleanup";

describe("decideCleanup", () => {
  it("goes back when the tab has history and focus is gone", () => {
    expect(decideCleanup({ historyLength: 2, hasFocus: false })).toBe("back");
  });

  it("closes when there is no history and focus is gone", () => {
    expect(decideCleanup({ historyLength: 1, hasFocus: false })).toBe("close");
  });

  it("does nothing when focus has returned", () => {
    expect(decideCleanup({ historyLength: 1, hasFocus: true })).toBe("none");
  });

  it("closes at history length one when focus is gone", () => {
    expect(decideCleanup({ historyLength: 1, hasFocus: false })).toBe("close");
  });

  it("does nothing at history length two when focused", () => {
    expect(decideCleanup({ historyLength: 2, hasFocus: true })).toBe("none");
  });
});
