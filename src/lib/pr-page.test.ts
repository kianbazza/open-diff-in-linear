import { describe, expect, it } from "vitest";
import { parsePrPage, prKey } from "./pr-page";

describe("parsePrPage", () => {
  it("parses GitHub overview", () => {
    expect(parsePrPage("https://github.com/acme/widgets/pull/42")).toEqual({
      host: "github",
      owner: "acme",
      repo: "widgets",
      number: 42,
      view: "overview",
    });
  });
  it("parses GitHub files", () =>
    expect(
      parsePrPage("https://github.com/acme/widgets/pull/42/files")?.view,
    ).toBe("changes"));
  it("parses GitHub files with a range", () =>
    expect(
      parsePrPage(
        "https://github.com/acme/widgets/pull/42/files/abc123..def456",
      )?.view,
    ).toBe("changes"));
  it("parses GitHub changes", () =>
    expect(
      parsePrPage("https://github.com/acme/widgets/pull/42/changes")?.view,
    ).toBe("changes"));
  it("marks GitHub commits as other", () =>
    expect(
      parsePrPage("https://github.com/acme/widgets/pull/42/commits")?.view,
    ).toBe("other"));
  it("marks GitHub checks as other", () =>
    expect(
      parsePrPage("https://github.com/acme/widgets/pull/42/checks")?.view,
    ).toBe("other"));
  it("ignores query and hash", () =>
    expect(
      parsePrPage(
        "https://github.com/acme/widgets/pull/42?diff=split#issuecomment-1",
      )?.view,
    ).toBe("overview"));
  it("rejects www.github.com", () =>
    expect(
      parsePrPage("https://www.github.com/acme/widgets/pull/42"),
    ).toBeNull());
  it("rejects zero and unsafe numbers", () => {
    expect(parsePrPage("https://github.com/acme/widgets/pull/0")).toBeNull();
    expect(
      parsePrPage("https://github.com/acme/widgets/pull/9007199254740993"),
    ).toBeNull();
  });
  it("accepts a trailing slash", () =>
    expect(parsePrPage("https://github.com/acme/widgets/pull/42/")?.view).toBe(
      "overview",
    ));
  it.each([
    "https://github.com/acme/widgets",
    "https://github.com/acme/widgets/pulls",
    "https://github.com/acme/widgets/pull/abc",
    "https://github.com/acme/widgets/issues/42",
    "https://gitlab.com/acme/widgets/pull/42",
    "http://github.com/acme/widgets/pull/42",
    "not a url",
  ])("rejects non-PR URL %s", (url) => expect(parsePrPage(url)).toBeNull());
  it("parses Graphite .dev", () =>
    expect(
      parsePrPage("https://app.graphite.dev/github/pr/acme/widgets/42"),
    ).toEqual({
      host: "graphite",
      owner: "acme",
      repo: "widgets",
      number: 42,
      view: "overview",
    }));
  it("parses Graphite .com", () =>
    expect(
      parsePrPage("https://app.graphite.com/github/pr/acme/widgets/42")?.host,
    ).toBe("graphite"));
  it("ignores Graphite trailing slug", () =>
    expect(
      parsePrPage(
        "https://app.graphite.dev/github/pr/acme/widgets/42/some-slug",
      )?.view,
    ).toBe("overview"));
  it("rejects Graphite non-PR paths", () =>
    expect(parsePrPage("https://app.graphite.dev/activity")).toBeNull());
  it("accepts a URL instance", () =>
    expect(
      parsePrPage(new URL("https://github.com/acme/widgets/pull/42"))?.number,
    ).toBe(42));
  it("creates a lower-cased PR key", () =>
    expect(prKey({ owner: "Acme", repo: "Widgets", number: 42 })).toBe(
      "acme/widgets#42",
    ));
});
