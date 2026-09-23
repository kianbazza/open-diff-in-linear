import { describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { browser } from "#imports";

describe("test environment", () => {
  it("routes the extension API through the fake browser", async () => {
    await fakeBrowser.storage.local.set({ probe: 1 });
    expect(await browser.storage.local.get("probe")).toEqual({ probe: 1 });
  });
});
