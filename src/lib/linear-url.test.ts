import { describe, expect, it } from "vitest";
import { flippedTarget, linearReviewPath, linearUrl } from "./linear-url";
import type { PrPage } from "./pr-page";

const github: PrPage = {
  host: "github",
  owner: "acme",
  repo: "widgets",
  number: 42,
  view: "overview",
};
const changes = { ...github, view: "changes" as const };
const other = { ...github, view: "other" as const };

describe("linearReviewPath", () => {
  it("builds the overview path", () =>
    expect(linearReviewPath(github)).toBe("review/acme/widgets/pull/42"));
  it("adds the changes suffix", () =>
    expect(linearReviewPath(changes)).toBe(
      "review/acme/widgets/pull/42/changes",
    ));
  it("maps other views to overview", () =>
    expect(linearReviewPath(other)).toBe("review/acme/widgets/pull/42"));
});

describe("linearUrl", () => {
  it("builds the desktop URL", () =>
    expect(linearUrl(github, "desktop")).toBe(
      "linear://review/acme/widgets/pull/42",
    ));
  it("builds the desktop changes URL", () =>
    expect(linearUrl(changes, "desktop")).toBe(
      "linear://review/acme/widgets/pull/42/changes",
    ));
  it("builds the web URL", () =>
    expect(linearUrl(github, "web")).toBe(
      "https://linear.app/review/acme/widgets/pull/42?noRedirect=1",
    ));
  it("builds the web changes URL", () =>
    expect(linearUrl(changes, "web")).toBe(
      "https://linear.app/review/acme/widgets/pull/42/changes?noRedirect=1",
    ));
  it("builds the Linear-decides URL without a query", () =>
    expect(linearUrl(github, "linear-decides")).toBe(
      "https://linear.app/review/acme/widgets/pull/42",
    ));
  it("builds the same URL for Graphite pages", () => {
    const graphite: PrPage = { ...github, host: "graphite" };
    expect(linearUrl(graphite, "web")).toBe(linearUrl(github, "web"));
  });
});

describe("flippedTarget", () => {
  it("flips desktop to web", () =>
    expect(flippedTarget("desktop")).toBe("web"));
  it("flips web to desktop", () =>
    expect(flippedTarget("web")).toBe("desktop"));
  it("has no flip for Linear decides", () =>
    expect(flippedTarget("linear-decides")).toBeNull());
});
