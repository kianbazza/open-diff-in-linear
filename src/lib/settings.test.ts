import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import {
  DEFAULT_SETTINGS,
  isOrgAllowlisted,
  normalizeOrg,
  parseAllowlist,
  readSettings,
  type Settings,
  sanitizeSettings,
  settingsItem,
} from "./settings";

beforeEach(() => {
  fakeBrowser.reset();
});

describe("settings storage", () => {
  it("returns defaults for a fresh store", async () => {
    expect(await readSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("reads stored settings", async () => {
    await settingsItem.setValue({ ...DEFAULT_SETTINGS, mode: "automatic" });
    expect(await readSettings()).toMatchObject({ mode: "automatic" });
  });

  it("fills missing stored values with defaults", async () => {
    await settingsItem.setValue({ mode: "automatic" } as Settings);
    expect(await readSettings()).toMatchObject({
      mode: "automatic",
      openTarget: "linear-decides",
      countdownSeconds: 1.5,
    });
  });
});

describe("allowlist helpers", () => {
  it.each([
    ["  @Acme ", "acme"],
    ["https://github.com/Acme/", "acme"],
    ["github.com/acme", "acme"],
    ["", ""],
  ])("normalizes %j", (input, expected) => {
    expect(normalizeOrg(input)).toBe(expected);
  });

  it("parses and de-duplicates orgs", () => {
    expect(parseAllowlist("Acme\n@beta, gamma acme")).toEqual([
      "acme",
      "beta",
      "gamma",
    ]);
  });

  it("matches orgs case-insensitively", () => {
    expect(isOrgAllowlisted(["acme"], "ACME")).toBe(true);
    expect(isOrgAllowlisted([], "acme")).toBe(false);
  });
});

describe("sanitizeSettings", () => {
  it("falls back field-by-field for invalid values", () => {
    expect(
      sanitizeSettings({
        mode: "auto",
        openTarget: "browser",
        countdownSeconds: 2,
        allowlist: "acme",
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("normalizes valid allowlist entries", () => {
    expect(
      sanitizeSettings({
        mode: "automatic",
        openTarget: "desktop",
        countdownSeconds: 3,
        allowlist: ["Acme", 7, "", "acme", "beta"],
      }),
    ).toEqual({
      mode: "automatic",
      openTarget: "desktop",
      countdownSeconds: 3,
      allowlist: ["acme", "beta"],
    });
  });

  it.each([null, "x"])("defaults non-object values", (value) => {
    expect(sanitizeSettings(value)).toEqual(DEFAULT_SETTINGS);
  });

  it("does not share the default allowlist array", () => {
    sanitizeSettings(null).allowlist.push("x");
    expect(DEFAULT_SETTINGS.allowlist).toEqual([]);
  });
});
