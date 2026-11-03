import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

// Regression: the background canvas and the labelled text inputs of the assistant (weeks and name) both used the class
// "field", so those inputs were pinned to the screen and overlapped the panel on steps 3 and 8.
describe('form fields', () => {
  const rules = [...css.matchAll(/(^|\n)([^{}\n@][^{}]*)\{([^{}]*)\}/g)].map((m) => ({ selector: m[2].trim(), body: m[3] }));

  it('the .field class used by the inputs is never fixed to the screen', () => {
    const fixed = rules.filter((r) => r.selector.split(',').some((s) => s.trim() === '.field') && /position:\s*fixed/.test(r.body));
    expect(fixed).toEqual([]);
  });

  it('the background canvas has its own class', () => {
    expect(html).toMatch(/<canvas class="bg-field"/);
    expect(css).toMatch(/\.bg-field\s*\{[^}]*position:\s*fixed/);
  });
});
