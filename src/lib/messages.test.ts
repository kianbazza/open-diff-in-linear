import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { isMessage, sendMessage } from "./messages";

beforeEach(() => fakeBrowser.reset());

describe("messages", () => {
  it("validates message shapes", () => {
    for (const type of [
      "mark-skip",
      "consume-skip",
      "record-handoff",
      "was-recently-handed-off",
    ])
      expect(isMessage({ type, prKey: "x" })).toBe(true);
    expect(isMessage(null)).toBe(false);
    expect(isMessage({})).toBe(false);
    expect(isMessage({ type: "other", prKey: "x" })).toBe(false);
    expect(isMessage({ type: "mark-skip" })).toBe(false);
    expect(isMessage({ type: "close-tab" })).toBe(true);
    expect(isMessage({ type: "close-tab", prKey: "x" })).toBe(true);
  });
  it("uses fallback when background is unavailable", async () => {
    expect(
      await sendMessage({ type: "was-recently-handed-off", prKey: "x" }, true),
    ).toBe(true);
  });
});
