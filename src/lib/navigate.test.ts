import { describe, expect, it, vi } from "vitest";
import { type NavigationWindow, openLinearUrl } from "./navigate";

describe("openLinearUrl", () => {
  it.each([
    ["linear://review/a/b/pull/1", "click", "assign"],
    ["linear://review/a/b/pull/1", "automatic", "assign"],
    ["https://linear.app/review/a/b/pull/1", "click", "open"],
    ["https://linear.app/review/a/b/pull/1", "automatic", "assign"],
  ] as const)("routes %s for %s", (url, kind, expected) => {
    const assign = vi.fn();
    const open = vi.fn();
    const win: NavigationWindow = { location: { assign }, open };
    openLinearUrl(url, kind, win);
    if (expected === "assign") {
      expect(assign).toHaveBeenCalledWith(url);
      expect(open).not.toHaveBeenCalled();
    } else {
      expect(open).toHaveBeenCalledWith(url, "_blank", "noopener");
      expect(assign).not.toHaveBeenCalled();
    }
  });
});
