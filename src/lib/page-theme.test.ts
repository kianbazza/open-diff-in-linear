import { describe, expect, it } from "vitest";
import { isDarkColor, parseCssColor, resolvePageTheme } from "./page-theme";

describe("parseCssColor", () => {
  it.each([
    ["rgb(255, 255, 255)", { r: 255, g: 255, b: 255, a: 1 }],
    ["rgba(13, 17, 23, 0.5)", { r: 13, g: 17, b: 23, a: 0.5 }],
    ["rgb(13 17 23 / 50%)", { r: 13, g: 17, b: 23, a: 0.5 }],
    ["rgba(0, 0, 0, 0)", { r: 0, g: 0, b: 0, a: 0 }],
  ])("parses %s", (input, expected) =>
    expect(parseCssColor(input)).toEqual(expected),
  );

  it.each(["transparent", "#fff", "oklch(0.2 0 0)", ""])(
    "rejects %s",
    (input) => expect(parseCssColor(input)).toBeNull(),
  );
});

describe("isDarkColor", () => {
  it("uses perceived brightness", () => {
    expect(isDarkColor({ r: 13, g: 17, b: 23, a: 1 })).toBe(true);
    expect(isDarkColor({ r: 255, g: 255, b: 255, a: 1 })).toBe(false);
    expect(isDarkColor({ r: 128, g: 128, b: 128, a: 1 })).toBe(false);
  });
});

describe("resolvePageTheme", () => {
  it("skips transparent backgrounds", () =>
    expect(
      resolvePageTheme(["rgba(0, 0, 0, 0)", "rgb(13, 17, 23)"], false),
    ).toBe("dark"));
  it("uses the first opaque background", () =>
    expect(resolvePageTheme(["rgb(255, 255, 255)"], true)).toBe("light"));
  it("falls back to the preferred scheme", () => {
    expect(
      resolvePageTheme(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"], true),
    ).toBe("dark");
    expect(
      resolvePageTheme(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"], false),
    ).toBe("light");
    expect(resolvePageTheme(["oklch(0.2 0 0)"], true)).toBe("dark");
  });
});
