import barbell from '@tabler/icons/outline/barbell.svg?raw';
import bottle from '@tabler/icons/outline/bottle.svg?raw';
import dumbbell from '@tabler/icons/outline/dumbbell.svg?raw';
import jumpRope from '@tabler/icons/outline/jump-rope.svg?raw';
import stopwatch from '@tabler/icons/outline/stopwatch.svg?raw';
import weight from '@tabler/icons/outline/weight.svg?raw';

// Background of gym equipment (the same Tabler icon family as the app). The glyphs breathe in a slow diagonal wave and grow,
// turn and take the lime to turquoise gradient near the pointer. Drawn only while a section that shows the field is on screen.
type Rgb = [number, number, number];
// The colours of the projects: every glyph keeps one of them, and near the pointer they blend into the tint of the project being looked at.
const LIME: Rgb = [166, 231, 130];
const TURQ: Rgb = [31, 191, 168];
const GLYPH_COLORS: Rgb[] = [LIME, TURQ, [251, 191, 36], [255, 171, 243], [223, 0, 127], [34, 197, 94], [167, 110, 205]];
export const PROJECT_TINTS: [Rgb, Rgb][] = [
  [LIME, TURQ],
  [[253, 224, 71], [245, 158, 11]],
  [[255, 171, 243], [34, 197, 94]],
  [[135, 58, 170], [223, 0, 127]],
];
const glyphs = [barbell, dumbbell, weight, jumpRope, stopwatch, bottle].map((svg) =>
  [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => new Path2D(m[1])),
);

const hash = (i: number, j: number): number => (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export interface Field {
  setTint(index: number): void;
}

export function startField(canvas: HTMLCanvasElement, zones: Element[], reduceMotion: boolean): Field {
  const ctx = canvas.getContext('2d');
  let tint = PROJECT_TINTS[0];
  if (!ctx) return { setTint: () => undefined };
  const pointer = { x: -999, y: -999, tx: -999, ty: -999 };
  let w = 0;
  let h = 0;
  let dpr = 1;
  let frame = 0;
  let running = false;

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(performance.now());
  };

  function draw(t: number): void {
    pointer.x += (pointer.tx - pointer.x) * 0.14;
    pointer.y += (pointer.ty - pointer.y) * 0.14;
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
    const cell = w < 700 ? 64 : 84;
    const radius = 190;
    for (let j = 0, y = cell / 2; y < h + cell; j++, y += cell) {
      for (let i = 0, x = cell / 2; x < w + cell; i++, x += cell) {
        const id = hash(i, j);
        const wave = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin((x + y) * 0.006 - t * 0.0006);
        const crest = Math.max(0, (wave - 0.65) / 0.35);
        const near = Math.max(0, 1 - Math.hypot(x - pointer.x, y - pointer.y) / radius) ** 2;
        const scale = (26 + wave * 3 + near * 26) / 24;
        const angle = (((id >> 8) % 41) - 20) * 0.01745 + wave * 0.1 + near * 0.7;
        const alpha = 0.12 + wave * 0.08 + crest * 0.13 + near * 0.75;
        const mix = Math.min(1, (x / w) * 0.6 + (y / h) * 0.4);
        const [a, b] = tint;
        const own = GLYPH_COLORS[(id >> 12) % GLYPH_COLORS.length];
        const c = near > 0.02 ? ([0, 1, 2] as const).map((k) => Math.round(lerp(own[k], lerp(a[k], b[k], mix), Math.min(1, near * 2)))) : own;
        ctx!.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, alpha)})`;
        const cos = Math.cos(angle) * scale * dpr;
        const sin = Math.sin(angle) * scale * dpr;
        ctx!.setTransform(cos, sin, -sin, cos, x * dpr, y * dpr);
        ctx!.translate(-12, -12);
        ctx!.lineWidth = 1.5;
        for (const path of glyphs[id % glyphs.length]) ctx!.stroke(path);
      }
    }
  }

  const loop = (t: number) => {
    draw(t);
    frame = running ? requestAnimationFrame(loop) : 0;
  };

  if (!reduceMotion) {
    const visible = new Set<Element>();
    const watcher = new IntersectionObserver((entries) => {
      for (const entry of entries) (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      running = visible.size > 0;
      if (running && !frame) frame = requestAnimationFrame(loop);
    });
    zones.forEach((zone) => watcher.observe(zone));
    addEventListener('pointermove', (e) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      if (pointer.x < 0) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = -999; });
  }
  addEventListener('resize', resize);
  resize();
  return {
    setTint(index) {
      tint = PROJECT_TINTS[index] ?? PROJECT_TINTS[0];
    },
  };
}
