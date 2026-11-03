// How much of the background equipment is kept at a point, given the blocks of text on the page. Over the text and a padding
// around it the glyphs drop to a floor so they never cut through letters; farther away they fade back to full strength.
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface QuietOptions {
  padding: number;
  fade: number;
  floor: number;
}

export const QUIET: QuietOptions = { padding: 22, fade: 70, floor: 0.14 };

export function quietFactor(x: number, y: number, boxes: readonly Box[], options: QuietOptions = QUIET): number {
  const { padding, fade, floor } = options;
  let factor = 1;
  for (const box of boxes) {
    const dx = Math.max(box.left - x, 0, x - box.right);
    const dy = Math.max(box.top - y, 0, y - box.bottom);
    const distance = Math.hypot(dx, dy);
    const t = Math.min(1, Math.max(0, (distance - padding) / fade));
    factor = Math.min(factor, floor + (1 - floor) * t * t * (3 - 2 * t));
  }
  return factor;
}
