import { describe, expect, it } from 'vitest';
import { quietFactor, type Box } from './quiet-zones';

const box: Box = { left: 100, top: 100, right: 300, bottom: 200 };
const options = { padding: 20, fade: 60, floor: 0.2 };

describe('quietFactor', () => {
  it('leaves the background untouched when there is no text', () => {
    expect(quietFactor(150, 150, [], options)).toBe(1);
  });

  it('is at its floor over the text and in the padding around it', () => {
    expect(quietFactor(200, 150, [box], options)).toBe(0.2);
    expect(quietFactor(85, 150, [box], options)).toBe(0.2);
    expect(quietFactor(200, 218, [box], options)).toBe(0.2);
  });

  it('is back to 1 once past the padding and the fade', () => {
    expect(quietFactor(100 - 20 - 60, 150, [box], options)).toBe(1);
    expect(quietFactor(10, 10, [box], options)).toBe(1);
  });

  it('rises smoothly with the distance from the text', () => {
    // The fade runs from 20 px (padding) to 80 px (padding + fade) away from the text.
    const samples = [25, 40, 55, 70].map((d) => quietFactor(100 - d, 150, [box], options));
    for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThan(samples[i - 1]);
    expect(samples[0]).toBeGreaterThan(0.2);
    expect(samples.at(-1)).toBeLessThan(1);
  });

  it('eases in with a smoothstep, so the halo has no visible edge', () => {
    // A quarter of the way through the fade, a smoothstep is at 0.15625 and a straight line would be at 0.25.
    const quarter = quietFactor(100 - (20 + 15), 150, [box], options);
    expect(quarter).toBeCloseTo(0.2 + 0.8 * 0.15625, 5);
  });

  it('fades below and above the text too, not only at its sides', () => {
    expect(quietFactor(200, 200 + 50, [box], options)).toBeGreaterThan(0.2);
    expect(quietFactor(200, 100 - 50, [box], options)).toBeGreaterThan(0.2);
    expect(quietFactor(300 + 50, 150, [box], options)).toBeGreaterThan(0.2);
  });

  it('measures from the nearest corner, not from the middle of the text', () => {
    const corner = quietFactor(100 - 40, 100 - 40, [box], options);
    const side = quietFactor(100 - 40, 150, [box], options);
    expect(corner).toBeGreaterThan(side);
  });

  it('takes the quietest of several blocks of text', () => {
    const other: Box = { left: 400, top: 100, right: 500, bottom: 200 };
    expect(quietFactor(450, 150, [box, other], options)).toBe(0.2);
    expect(quietFactor(200, 150, [box, other], options)).toBe(0.2);
    expect(quietFactor(350, 150, [box, other], options)).toBeGreaterThan(0.2);
  });
});
