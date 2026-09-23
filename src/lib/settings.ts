import { storage } from "#imports";
import type { OpenTarget } from "./linear-url";

export type Mode = "manual" | "automatic";
export const COUNTDOWN_OPTIONS = [0.5, 1, 1.5, 3] as const;
export type CountdownSeconds = (typeof COUNTDOWN_OPTIONS)[number];
/** Every open target, in popup order. A compile-time check fails typecheck if `OpenTarget` gains a member missing here. */
export const OPEN_TARGETS = [
  "linear-decides",
  "desktop",
  "web",
] as const satisfies readonly OpenTarget[];
const openTargetsComplete: Exclude<
  OpenTarget,
  (typeof OPEN_TARGETS)[number]
> extends never
  ? true
  : never = true;
void openTargetsComplete;

export interface Settings {
  mode: Mode;
  openTarget: OpenTarget;
  countdownSeconds: CountdownSeconds;
  /** GitHub org names, normalised with `normalizeOrg`, no duplicates. */
  allowlist: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  mode: "manual",
  openTarget: "linear-decides",
  countdownSeconds: 1.5,
  allowlist: [],
};

export const settingsItem = storage.defineItem<Settings>("local:settings", {
  fallback: DEFAULT_SETTINGS,
  version: 1,
});

/** Trim, lower-case, strip a leading "@" and any "github.com/" prefix or trailing "/". Empty string when nothing is left. */
export function normalizeOrg(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/^github\.com\//, "")
      .replace(/^@/, "")
      .split("/")[0]
      ?.trim() ?? ""
  );
}

/** Parse free text (one org per line, or comma/space separated) into a de-duplicated, normalised allowlist. */
export function parseAllowlist(text: string): string[] {
  return normalizeOrgs(text.split(/[\s,]+/));
}

/** True when `owner` (any casing) is in the allowlist. */
export function isOrgAllowlisted(
  allowlist: readonly string[],
  owner: string,
): boolean {
  const normalizedOwner = normalizeOrg(owner);
  return allowlist.some((org) => normalizeOrg(org) === normalizedOwner);
}

function isMode(value: unknown): value is Mode {
  return value === "manual" || value === "automatic";
}

export function isOpenTarget(value: unknown): value is OpenTarget {
  return (OPEN_TARGETS as readonly unknown[]).includes(value);
}

function isCountdown(value: unknown): value is CountdownSeconds {
  return (
    typeof value === "number" &&
    (COUNTDOWN_OPTIONS as readonly number[]).includes(value)
  );
}

function normalizeOrgs(entries: readonly string[]): string[] {
  return [...new Set(entries.map(normalizeOrg).filter(Boolean))];
}

/** Turn whatever is in storage (possibly partial, stale, or corrupted) into valid settings: each field that is missing or not a valid value falls back to `DEFAULT_SETTINGS`. */
export function sanitizeSettings(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) {
    return { ...DEFAULT_SETTINGS, allowlist: [] };
  }
  const value = raw as Record<string, unknown>;
  const allowlistValue = value.allowlist;
  const allowlist = Array.isArray(allowlistValue)
    ? normalizeOrgs(
        allowlistValue.filter(
          (entry): entry is string => typeof entry === "string",
        ),
      )
    : [...DEFAULT_SETTINGS.allowlist];

  return {
    mode: isMode(value.mode) ? value.mode : DEFAULT_SETTINGS.mode,
    openTarget: isOpenTarget(value.openTarget)
      ? value.openTarget
      : DEFAULT_SETTINGS.openTarget,
    countdownSeconds: isCountdown(value.countdownSeconds)
      ? value.countdownSeconds
      : DEFAULT_SETTINGS.countdownSeconds,
    allowlist,
  };
}

/** Read settings from storage, sanitised. */
export async function readSettings(): Promise<Settings> {
  return sanitizeSettings(await settingsItem.getValue());
}
