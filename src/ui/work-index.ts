// The project names. With a mouse, hovering or focusing a giant name shows its capture. Without hover (phones and tablets)
// the names become a row of cards you swipe: the card in the middle is the active project, its colours tint the background,
// and each snap gives a short tap of haptics where the device has it.
const PREVIEWS = [
  { src: '/captures/fitte-app.svg', fit: 'contain' },
  { src: '/captures/hamd-desktop.webp', fit: 'cover' },
  { src: '/captures/budget-desktop.webp', fit: 'cover' },
  { src: '/captures/alumni-desktop.webp', fit: 'cover' },
];

export function wireWorkIndex(links: HTMLAnchorElement[], preview: HTMLElement, cards: HTMLElement, onShow: (index: number) => void): void {
  if (matchMedia('(hover: hover) and (min-width: 900px)').matches) {
    const images = PREVIEWS.map(({ src, fit }) => {
      const img = new Image();
      img.src = src;
      img.alt = '';
      img.style.objectFit = fit;
      img.decoding = 'async';
      preview.appendChild(img);
      return img;
    });
    const show = (i: number) => {
      images.forEach((img, n) => img.classList.toggle('is-on', n === i));
      links.forEach((link, n) => (n === i ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current')));
      onShow(i);
    };
    links.forEach((link, i) => {
      link.addEventListener('mouseenter', () => show(i));
      link.addEventListener('focus', () => show(i));
    });
    show(0);
    return;
  }

  const items = [...cards.querySelectorAll<HTMLElement>('.card')];
  const dots = [...(cards.parentElement?.querySelectorAll<HTMLElement>('.work__dots i') ?? [])];
  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    const first = active === -1;
    active = i;
    items.forEach((card, n) => card.classList.toggle('is-active', n === i));
    dots.forEach((dot, n) => dot.classList.toggle('on', n === i));
    onShow(i);
    if (!first) navigator.vibrate?.(8);
  };
  let frame = 0;
  const update = () => {
    frame = 0;
    const middle = cards.getBoundingClientRect().left + cards.clientWidth / 2;
    let best = 0;
    let distance = Infinity;
    items.forEach((card, n) => {
      const rect = card.getBoundingClientRect();
      const d = Math.abs(rect.left + rect.width / 2 - middle);
      if (d < distance) {
        distance = d;
        best = n;
      }
    });
    setActive(best);
  };
  cards.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  update();
}
