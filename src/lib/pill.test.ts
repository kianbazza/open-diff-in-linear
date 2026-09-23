import { describe, expect, it } from "vitest";
import { DEFAULT_PILL_LABEL, pillPresentation } from "./pill";

describe("pillPresentation", () => {
  it.each([
    ["desktop", false, DEFAULT_PILL_LABEL, "desktop"],
    ["desktop", true, "Open in web app", "web"],
    ["web", false, DEFAULT_PILL_LABEL, "web"],
    ["web", true, "Open in desktop app", "desktop"],
    ["linear-decides", false, DEFAULT_PILL_LABEL, "linear-decides"],
    ["linear-decides", true, DEFAULT_PILL_LABEL, "linear-decides"],
  ] as const)(
    "%s with flipHeld=%s",
    (target, flipHeld, label, resultTarget) => {
      expect(pillPresentation(target, flipHeld)).toEqual({
        label,
        target: resultTarget,
      });
    },
  );
});
