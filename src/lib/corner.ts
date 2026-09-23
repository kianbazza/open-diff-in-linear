export const CORNER_MARGIN_PX = 16;
export const CORNER_GAP_PX = 8;

/** The parts of a DOMRect this needs. */
export interface ObstacleRect {
  top: number;
  width: number;
  height: number;
}

/**
 * CSS `bottom` (px) for our bottom-left UI: the usual margin, or just above another
 * extension's bottom-left widget when one is showing.
 */
export function cornerBottom(
  obstacle: ObstacleRect | null,
  viewportHeight: number,
): number {
  if (obstacle === null || obstacle.width === 0 || obstacle.height === 0)
    return CORNER_MARGIN_PX;
  return Math.max(
    CORNER_MARGIN_PX,
    Math.round(viewportHeight - obstacle.top + CORNER_GAP_PX),
  );
}
