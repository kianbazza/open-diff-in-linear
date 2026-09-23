export type Host = "github" | "graphite";
export type View = "overview" | "changes" | "other";

export interface PrPage {
  host: Host;
  owner: string;
  repo: string;
  number: number;
  view: View;
}

/** Parse a URL into a PR page, or null when the URL is not a PR page. */
export function parsePrPage(url: string | URL): PrPage | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  let parts: {
    host: Host;
    owner: string | undefined;
    repo: string | undefined;
    numberSegment: string | undefined;
    view: View;
  };

  if (parsed.hostname === "github.com") {
    const [owner, repo, pull, numberSegment, sub] = segments;
    if (pull !== "pull") return null;
    parts = {
      host: "github",
      owner,
      repo,
      numberSegment,
      view:
        sub === undefined
          ? "overview"
          : sub === "files" || sub === "changes"
            ? "changes"
            : "other",
    };
  } else if (
    parsed.hostname === "app.graphite.dev" ||
    parsed.hostname === "app.graphite.com"
  ) {
    const [gh, pr, owner, repo, numberSegment] = segments;
    if (gh !== "github" || pr !== "pr") return null;
    parts = { host: "graphite", owner, repo, numberSegment, view: "overview" };
  } else {
    return null;
  }

  if (
    typeof parts.owner !== "string" ||
    !/^[A-Za-z0-9_.-]+$/.test(parts.owner) ||
    typeof parts.repo !== "string" ||
    !/^[A-Za-z0-9_.-]+$/.test(parts.repo) ||
    typeof parts.numberSegment !== "string" ||
    !/^\d+$/.test(parts.numberSegment)
  )
    return null;

  const number = Number.parseInt(parts.numberSegment, 10);
  if (!Number.isSafeInteger(number) || number <= 0) return null;

  return {
    host: parts.host,
    owner: parts.owner,
    repo: parts.repo,
    number,
    view: parts.view,
  };
}

/** Stable identity for "the same PR" across views and hosts: `${owner}/${repo}#${number}`, lower-cased. */
export function prKey(page: Pick<PrPage, "owner" | "repo" | "number">): string {
  return `${page.owner}/${page.repo}#${page.number}`.toLowerCase();
}
