import { describe, expect, it } from "vitest";
import { arrivalKey, decideArrival } from "./automatic";
import { type PrPage, parsePrPage } from "./pr-page";
import { DEFAULT_SETTINGS, type Settings } from "./settings";

const page: PrPage = {
  host: "github",
  owner: "acme",
  repo: "app",
  number: 1,
  view: "overview",
};
const automatic: Settings = {
  ...DEFAULT_SETTINGS,
  mode: "automatic",
  allowlist: ["acme"],
  countdownSeconds: 3,
};

describe("decideArrival", () => {
  it("prioritizes manual mode", () =>
    expect(
      decideArrival({
        page,
        settings: { ...automatic, mode: "manual" },
        cancelled: false,
      }),
    ).toEqual({ kind: "none", reason: "manual-mode" }));
  it("rejects an owner not on the allowlist", () =>
    expect(
      decideArrival({
        page,
        settings: { ...automatic, allowlist: [] },
        cancelled: false,
      }),
    ).toEqual({ kind: "none", reason: "not-allowlisted" }));
  it("rejects other views", () =>
    expect(
      decideArrival({
        page: { ...page, view: "other" },
        settings: automatic,
        cancelled: false,
      }),
    ).toEqual({ kind: "none", reason: "view-not-handed-off" }));
  it("rejects a cancelled PR", () =>
    expect(
      decideArrival({ page, settings: automatic, cancelled: true }),
    ).toEqual({ kind: "none", reason: "cancelled" }));
  it("starts a countdown on overview", () =>
    expect(
      decideArrival({ page, settings: automatic, cancelled: false }),
    ).toEqual({ kind: "countdown", seconds: automatic.countdownSeconds }));
  it("starts a countdown on changes", () =>
    expect(
      decideArrival({
        page: { ...page, view: "changes" },
        settings: automatic,
        cancelled: false,
      }),
    ).toEqual({ kind: "countdown", seconds: automatic.countdownSeconds }));
  it("allows Graphite pages", () =>
    expect(
      decideArrival({
        page: { ...page, host: "graphite" },
        settings: automatic,
        cancelled: false,
      }),
    ).toEqual({ kind: "countdown", seconds: automatic.countdownSeconds }));
  it("matches allowlist case-insensitively", () =>
    expect(
      decideArrival({
        page: { ...page, owner: "ACME" },
        settings: automatic,
        cancelled: false,
      }).kind,
    ).toBe("countdown"));
});

describe("arrivalKey", () => {
  const parse = (url: string) => {
    const result = parsePrPage(url);
    if (result === null) throw new Error(`Invalid PR URL: ${url}`);
    return result;
  };

  it("ignores hash and query changes", () => {
    const base = "https://github.com/acme/app/pull/42";
    expect(arrivalKey(parse(base))).toBe(
      arrivalKey(parse(`${base}#issuecomment-1`)),
    );
    expect(arrivalKey(parse(base))).toBe(
      arrivalKey(parse(`${base}?diff=split`)),
    );
  });
  it("differs between overview and changes", () =>
    expect(arrivalKey(parse("https://github.com/acme/app/pull/42"))).not.toBe(
      arrivalKey(parse("https://github.com/acme/app/pull/42/files")),
    ));
  it("differs between GitHub and Graphite", () =>
    expect(arrivalKey(parse("https://github.com/acme/app/pull/42"))).not.toBe(
      arrivalKey(parse("https://app.graphite.dev/github/pr/acme/app/42")),
    ));
});
