import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './style.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import arrowUpRight from '@phosphor-icons/core/assets/regular/arrow-up-right.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import copy from '@phosphor-icons/core/assets/regular/copy.svg?raw';
import githubLogo from '@phosphor-icons/core/assets/regular/github-logo.svg?raw';
import linkedinLogo from '@phosphor-icons/core/assets/regular/linkedin-logo.svg?raw';

import { progressionStep, readNumber, suggestSets, type LoadType, type LoggedSet, type SetKind } from './lib/suggest-sets';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const icons: Record<string, string> = {
  'arrow-up-right': arrowUpRight,
  copy,
  'github-logo': githubLogo,
  'linkedin-logo': linkedinLogo,
};
document.querySelectorAll<HTMLElement>('i[data-icon]').forEach((el) => {
  el.innerHTML = icons[el.dataset.icon ?? ''] ?? '';
  el.setAttribute('aria-hidden', 'true');
});

// Live demo: the Fittë double progression rule, one result per set.
function wireDemo(demo: HTMLElement): void {
  const cap = demo.querySelector<HTMLInputElement>('[data-cap]')!;
  const loads = demo.querySelectorAll<HTMLInputElement>('input[name="load"]');
  const rows = [...demo.querySelectorAll<HTMLElement>('[data-set]')];
  const shown = new WeakMap<HTMLElement, string>();

  const loadType = (): LoadType => ([...loads].find((r) => r.checked)?.value as LoadType) ?? 'PER_SIDE';

  const render = (animate: boolean) => {
    const type = loadType();
    demo.querySelectorAll<HTMLElement>('[data-weight-label]').forEach((el) => {
      el.textContent = type === 'PER_SIDE' ? 'Weight per side, kg' : 'Weight, kg';
    });
    const logged: LoggedSet[] = rows.map((row) => ({
      type: row.dataset.kind as SetKind,
      weight: readNumber(row.querySelector<HTMLInputElement>('[data-weight]')!.value),
      reps: readNumber(row.querySelector<HTMLInputElement>('[data-reps]')!.value),
    }));
    // A cap of 0 would mark every set as reached, so an empty field falls back to 1.
    const result = suggestSets(logged, Math.max(1, readNumber(cap.value)), type);

    rows.forEach((row, i) => {
      const out = row.querySelector<HTMLElement>('[data-next]')!;
      const s = result[i];
      const up = s.reason === 'INCREASE';
      const html =
        logged[i].weight === 0
          ? '<span class="set__hint">Enter a weight</span>'
          : `<strong>${s.suggestedWeight} kg</strong><span class="tag${up ? ' tag--up' : ''}">${s.reason}</span>`;
      if (shown.get(row) === html) return;
      const first = !shown.has(row);
      shown.set(row, html);
      out.innerHTML = html;
      if (animate && !first && !reduceMotion) {
        gsap.fromTo(out, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' });
      }
    });
    demo.dataset.step = String(progressionStep(type));
  };

  demo.addEventListener('input', () => render(true));
  render(false);
}
document.querySelectorAll<HTMLElement>('[data-demo]').forEach(wireDemo);

// Copy the email address; the label confirms it.
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  const label = btn.querySelector('span')!;
  const icon = btn.querySelector('i')!;
  let timer: number | undefined;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      label.textContent = 'Copied';
      icon.innerHTML = check;
    } catch {
      label.textContent = 'Select and copy it above';
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      label.textContent = 'Copy email';
      icon.innerHTML = copy;
    }, 2200);
  });
});

// Motion. Everything below is skipped under prefers-reduced-motion.
function intro(): void {
  const title = document.querySelector<HTMLElement>('[data-split]')!;
  const rest = gsap.utils.toArray<HTMLElement>('[data-intro]');
  const play = () => {
    gsap.set(title, { visibility: 'visible' });
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.09 }),
    });
    gsap.fromTo(rest, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 0.3 });
  };
  document.fonts.ready.then(play);
  // If the intro cannot run, never leave the content hidden.
  window.setTimeout(() => {
    if (getComputedStyle(title).visibility === 'hidden') root.classList.add('no-intro');
  }, 2500);
}

function chapters(): void {
  const mm = gsap.matchMedia();

  // Wide, tall windows: each chapter is a sticky sheet; the one underneath recedes while the next one covers it.
  mm.add('(min-width: 900px) and (min-height: 640px)', () => {
    const sheets = gsap.utils.toArray<HTMLElement>('.chapter');
    sheets.forEach((sheet, i) => {
      const media = sheet.querySelector('.chapter__media');
      gsap.fromTo(
        media,
        { yPercent: 7 },
        { yPercent: 0, ease: 'none', scrollTrigger: { trigger: sheet, start: 'top bottom', end: 'top top', scrub: true } },
      );
      const next = sheets[i + 1];
      if (!next) return;
      gsap.to(sheet.querySelector('.chapter__inner'), {
        scale: 0.95,
        opacity: 0.4,
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
      });
    });
  });

  // Phones and short windows: plain flow, each block settles in once as it appears.
  mm.add('(max-width: 899px), (max-height: 639px)', () => {
    const blocks = gsap.utils.toArray<HTMLElement>('.chapter__copy, .chapter__media');
    gsap.set(blocks, { autoAlpha: 0, y: 24 });
    ScrollTrigger.batch(blocks, {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1 }),
    });
  });
}

if (reduceMotion) {
  root.classList.remove('motion');
} else {
  intro();
  chapters();
}
