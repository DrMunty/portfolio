import barbell from '@tabler/icons/outline/barbell.svg?raw';
import bottle from '@tabler/icons/outline/bottle.svg?raw';
import dumbbell from '@tabler/icons/outline/dumbbell.svg?raw';
import jumpRope from '@tabler/icons/outline/jump-rope.svg?raw';
import stopwatch from '@tabler/icons/outline/stopwatch.svg?raw';
import weight from '@tabler/icons/outline/weight.svg?raw';

// Background of gym equipment (the same Tabler icon family as the app). The glyphs breathe in a slow diagonal wave and grow,
// turn and take a gradient near a "light": the pointer on a computer; on a phone, which has no cursor, three lights that roam
// by themselves and the finger while it touches the screen. Scrolling drags the grid and speeds up the wave.
// Drawn only while a section that shows the field is on screen.
type Rgb = [number, number, number];
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

interface Light {
  x: number;
  y: number;
  strength: number;
  tint: [Rgb, Rgb];
}

export interface Field {
  setTint(index: number): void;
}

export function startField(canvas: HTMLCanvasElement, zones: Element[], reduceMotion: boolean): Field {
  const ctx = canvas.getContext('2d');
  let tint = PROJECT_TINTS[0];
  if (!ctx) return { setTint: () => undefined };

  const touchDevice = matchMedia('(hover: none)').matches;
  const pointer: Light = { x: -999, y: -999, strength: 0, tint };
  const target = { x: -999, y: -999 };
  const finger: Light = { x: -999, y: -999, strength: 0, tint };
  let fingerDown = false;
  // Three lights that wander on their own paths: they stand in for the cursor on a phone.
  const roamers = PROJECT_TINTS.slice(0, 3).map((t, i) => ({ light: { x: 0, y: 0, strength: 0.7, tint: t } as Light, sx: 0.00031 + i * 0.00009, sy: 0.00023 + i * 0.00013, px: i * 2.1, py: i * 1.3 }));

  let w = 0;
  let h = 0;
  let dpr = 1;
  let frame = 0;
  let running = false;
  let lastScroll = scrollY;
  let velocity = 0;
  let phase = 0;
  let lastT = performance.now();

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = innerWidth;
    h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(performance.now());
  };

  function draw(t: number): void {
    const dt = Math.min(64, t - lastT);
    lastT = t;
    velocity += (Math.abs(scrollY - lastScroll) - velocity) * 0.15;
    lastScroll = scrollY;
    phase += dt * 0.0006 * (reduceMotion ? 0 : 1 + Math.min(6, velocity * 0.25));

    pointer.x += (target.x - pointer.x) * 0.14;
    pointer.y += (target.y - pointer.y) * 0.14;
    if (!fingerDown) finger.strength = Math.max(0, finger.strength - dt * 0.0016);
    const lights: Light[] = [pointer, finger];
    if (touchDevice) {
      for (const r of roamers) {
        r.light.x = w * (0.5 + 0.42 * Math.sin(t * r.sx + r.px));
        r.light.y = h * (0.5 + 0.42 * Math.sin(t * r.sy + r.py));
        lights.push(r.light);
      }
    }

    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';
    const cell = w < 700 ? 64 : 84;
    const radius = touchDevice ? 150 : 190;
    const drift = (scrollY * 0.18) % cell;
    for (let j = 0, y = cell / 2 - drift - cell; y < h + cell; j++, y += cell) {
      for (let i = 0, x = cell / 2; x < w + cell; i++, x += cell) {
        const id = hash(i, j);
        const wave = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin((x + y) * 0.006 - phase);
        const crest = Math.max(0, (wave - 0.65) / 0.35);
        let near = 0;
        let lit: Light | null = null;
        for (const light of lights) {
          const value = Math.max(0, 1 - Math.hypot(x - light.x, y - light.y) / radius) ** 2 * light.strength;
          if (value > near) {
            near = value;
            lit = light;
          }
        }
        const scale = (26 + wave * 3 + near * 26) / 24;
        const angle = (((id >> 8) % 41) - 20) * 0.01745 + wave * 0.1 + near * 0.7;
        const alpha = 0.12 + wave * 0.08 + crest * 0.13 + near * 0.75;
        const mix = Math.min(1, (x / w) * 0.6 + (y / h) * 0.4);
        const own = GLYPH_COLORS[(id >> 12) % GLYPH_COLORS.length];
        let c: readonly number[] = own;
        if (lit && near > 0.02) {
          const [a, b] = lit.tint;
          c = ([0, 1, 2] as const).map((k) => Math.round(lerp(own[k], lerp(a[k], b[k], mix), Math.min(1, near * 2))));
        }
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
      if (e.pointerType === 'touch') return;
      target.x = e.clientX;
      target.y = e.clientY;
      pointer.strength = 1;
      if (pointer.x < 0) {
        pointer.x = target.x;
        pointer.y = target.y;
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.strength = 0; });
    // The finger lights the glyphs under it while it touches the screen, even while the page scrolls.
    const touch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      fingerDown = true;
      finger.x = t.clientX;
      finger.y = t.clientY;
      finger.strength = 1;
    };
    addEventListener('touchstart', touch, { passive: true });
    addEventListener('touchmove', touch, { passive: true });
    const release = () => { fingerDown = false; };
    addEventListener('touchend', release, { passive: true });
    addEventListener('touchcancel', release, { passive: true });
  }
  addEventListener('resize', resize);
  resize();
  return {
    setTint(index) {
      tint = PROJECT_TINTS[index] ?? PROJECT_TINTS[0];
      pointer.tint = tint;
      finger.tint = tint;
    },
  };
}
