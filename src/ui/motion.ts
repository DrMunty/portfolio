import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { beforeApply } from '../i18n/dom';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Hero intro: the headline enters line by line, the rest of the hero follows, the equipment field fades in.
export function intro(canvas: HTMLCanvasElement): void {
  const title = document.querySelector<HTMLElement>('[data-split]')!;
  const rest = gsap.utils.toArray<HTMLElement>('[data-intro]');
  gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.6, ease: 'power2.out' });
  const play = () => {
    gsap.set(title, { visibility: 'visible' });
    // The headline is split into lines only for its entrance; afterwards it goes back to plain text so a change of language can rewrite it.
    let split: SplitText | null = SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.09, onComplete: () => { split?.revert(); split = null; } }),
    });
    beforeApply.push(() => { split?.revert(); split = null; });
    gsap.fromTo(rest, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 0.3 });
  };
  document.fonts.ready.then(play);
}

export function chapters(): void {
  const mm = gsap.matchMedia();

  // Wide, tall windows: each chapter is a sticky sheet; the one underneath darkens and recedes while the next one covers it.
  mm.add('(min-width: 900px) and (min-height: 640px)', () => {
    const sheets = gsap.utils.toArray<HTMLElement>('.chapter');
    sheets.forEach((sheet, i) => {
      gsap.fromTo(
        sheet.querySelector('.chapter__media'),
        { yPercent: 7 },
        { yPercent: 0, ease: 'none', scrollTrigger: { trigger: sheet, start: 'top bottom', end: 'top top', scrub: true } },
      );
      const next = sheets[i + 1];
      if (!next) return;
      const scrollTrigger = { trigger: next, start: 'top bottom', end: 'top top', scrub: true };
      gsap.to(sheet, { '--cover': 0.6, ease: 'none', scrollTrigger });
      gsap.to(sheet.querySelector('.chapter__inner'), { scale: 0.95, ease: 'none', scrollTrigger });
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
    // The phone capture drifts against the desktop frame as the chapter scrolls by, so each project has some depth.
    gsap.utils.toArray<HTMLElement>('.device__phone').forEach((phone) => {
      gsap.fromTo(
        phone,
        { yPercent: 14 },
        { yPercent: -10, ease: 'none', scrollTrigger: { trigger: phone.closest('.chapter'), start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    });
  });
}
