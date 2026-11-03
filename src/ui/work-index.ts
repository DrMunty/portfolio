// The giant project names: hovering or focusing one shows its capture. Only built for pointers that can hover.
const PREVIEWS = [
  { src: '/captures/fitte-app.svg', fit: 'contain' },
  { src: '/captures/hamd-desktop.webp', fit: 'cover' },
  { src: '/captures/budget-desktop.webp', fit: 'cover' },
  { src: '/captures/alumni-desktop.webp', fit: 'cover' },
];

export function wireWorkIndex(links: HTMLAnchorElement[], preview: HTMLElement): void {
  if (!matchMedia('(hover: hover) and (min-width: 900px)').matches) return;
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
  };
  links.forEach((link, i) => {
    link.addEventListener('mouseenter', () => show(i));
    link.addEventListener('focus', () => show(i));
  });
  show(0);
}
