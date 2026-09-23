export type PageTheme = "light" | "dark";
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parse a computed CSS colour in `rgb()`/`rgba()` form (comma or space syntax, optional `/ alpha`, alpha as a number or a percentage). Anything else → null. */
export function parseCssColor(value: string): Rgba | null {
  const match = value.trim().match(/^rgba?\((.*)\)$/i);
  if (!match?.[1]) return null;
  const channels = match[1]
    .replace(/\s*\/\s*/, " ")
    .split(/[\s,]+/)
    .filter(Boolean);
  if (channels.length !== 3 && channels.length !== 4) return null;
  const rgb = channels.slice(0, 3).map(Number);
  if (
    rgb.some(
      (channel) => !Number.isFinite(channel) || channel < 0 || channel > 255,
    )
  )
    return null;
  const alphaText = channels[3];
  const a =
    alphaText === undefined
      ? 1
      : alphaText.endsWith("%")
        ? Number(alphaText.slice(0, -1)) / 100
        : Number(alphaText);
  if (!Number.isFinite(a) || a < 0 || a > 1) return null;
  const [r, g, b] = rgb;
  if (r === undefined || g === undefined || b === undefined) return null;
  return { r, g, b, a };
}

/** Perceived brightness below half: `(0.299 r + 0.587 g + 0.114 b) / 255 < 0.5`. */
export function isDarkColor(color: Rgba): boolean {
  return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255 < 0.5;
}

/** The first background that parses with alpha ≥ 0.5 decides; none → `prefersDark`. */
export function resolvePageTheme(
  backgrounds: readonly string[],
  prefersDark: boolean,
): PageTheme {
  for (const background of backgrounds) {
    const color = parseCssColor(background);
    if (color && color.a >= 0.5) return isDarkColor(color) ? "dark" : "light";
  }
  return prefersDark ? "dark" : "light";
}
