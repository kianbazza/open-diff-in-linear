import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  consumeSkip,
  HANDOFF_TTL_MS,
  markSkip,
  recordHandoff,
  SKIP_TTL_MS,
  wasRecentlyHandedOff,
} from "./session-records";

beforeEach(() => fakeBrowser.reset());

describe("session records", () => {
  it("consumes only marked skips", async () => {
    expect(await consumeSkip(1, "a/b#1", 100)).toBe(false);
    await markSkip(1, "a/b#1", 100);
    expect(await consumeSkip(1, "a/b#1", 101)).toBe(true);
    expect(await consumeSkip(1, "a/b#1", 102)).toBe(false);
  });
  it("scopes skips to a tab", async () => {
    await markSkip(1, "a/b#1", 100);
    expect(await consumeSkip(2, "a/b#1", 101)).toBe(false);
    expect(await consumeSkip(1, "a/b#1", 102)).toBe(true);
  });
  it("expires skip marks", async () => {
    await markSkip(1, "a/b#1", 100);
    expect(await consumeSkip(1, "a/b#1", 100 + SKIP_TTL_MS + 1)).toBe(false);
  });
  it("expires handoffs after their TTL", async () => {
    await recordHandoff("a/b#1", 100);
    expect(await wasRecentlyHandedOff("a/b#1", 100 + 59_000)).toBe(true);
    expect(await wasRecentlyHandedOff("a/b#1", 100 + HANDOFF_TTL_MS + 1)).toBe(
      false,
    );
  });
  it("keeps handoff records per PR", async () => {
    await recordHandoff("a/b#1", 100);
    expect(await wasRecentlyHandedOff("a/b#2", 101)).toBe(false);
  });
  it("preserves concurrent records", async () => {
    await Promise.all([
      recordHandoff("a/b#1", 100),
      recordHandoff("a/b#2", 100),
    ]);
    expect(await wasRecentlyHandedOff("a/b#1", 101)).toBe(true);
    expect(await wasRecentlyHandedOff("a/b#2", 101)).toBe(true);
  });
});
