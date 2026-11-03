import barbell from '@tabler/icons/outline/barbell.svg?raw';
import bottle from '@tabler/icons/outline/bottle.svg?raw';
import dumbbell from '@tabler/icons/outline/dumbbell.svg?raw';
import jumpRope from '@tabler/icons/outline/jump-rope.svg?raw';
import stopwatch from '@tabler/icons/outline/stopwatch.svg?raw';
import weight from '@tabler/icons/outline/weight.svg?raw';

// Background of gym equipment (the same Tabler icon family as the app). The glyphs breathe in a slow diagonal wave and grow,
// turn and take the lime to turquoise gradient near the pointer. Drawn only while a section that shows the field is on screen.
const LIME = [166, 231, 130];
const TURQ = [31, 191, 168];
const glyphs = [barbell, dumbbell, weight, jumpRope, stopwatch, bottle].map((svg) =>
  [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => new Path2D(m[1])),
);

const hash = (i: number, j: number): number => (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function startField(canvas: HTMLCanvasElement, zones: Element[], reduceMotion: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
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
        const alpha = 0.075 + wave * 0.06 + crest * 0.08 + near * 0.85;
        const tinted = near > 0.02 || crest > 0.2;
        const mix = Math.min(1, (x / w) * 0.6 + (y / h) * 0.4);
        ctx!.strokeStyle = tinted
          ? `rgba(${Math.round(lerp(LIME[0], TURQ[0], mix))},${Math.round(lerp(LIME[1], TURQ[1], mix))},${Math.round(lerp(LIME[2], TURQ[2], mix))},${Math.min(1, alpha)})`
          : `rgba(255,255,255,${alpha})`;
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
}
