import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { handleMessage } from "./background-handlers";

beforeEach(() => fakeBrowser.reset());

describe("handleMessage", () => {
  it("marks and consumes in the sending tab", async () => {
    await handleMessage({ type: "mark-skip", prKey: "a/b#1" }, 7);
    expect(
      await handleMessage({ type: "consume-skip", prKey: "a/b#1" }, 7),
    ).toBe(true);
  });
  it("does not consume another tab's mark", async () => {
    await handleMessage({ type: "mark-skip", prKey: "a/b#1" }, 7);
    expect(
      await handleMessage({ type: "consume-skip", prKey: "a/b#1" }, 8),
    ).toBe(false);
  });
  it("rejects skip consumption without a tab", async () => {
    expect(
      await handleMessage({ type: "consume-skip", prKey: "a/b#1" }, undefined),
    ).toBe(false);
  });
  it("records handoffs", async () => {
    await handleMessage({ type: "record-handoff", prKey: "a/b#1" }, 7);
    expect(
      await handleMessage(
        { type: "was-recently-handed-off", prKey: "a/b#1" },
        7,
      ),
    ).toBe(true);
  });
});
