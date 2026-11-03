# Albert Muntal, portfolio

Personal portfolio of Albert Muntal, full-stack developer. It gathers Fittë, Movie's Platform (HAMD), Budget Calculator and Alumni Platform.

The first screen runs `suggestSets`, the double progression rule of the Fittë API, live in the browser (`src/lib/suggest-sets.ts`, with its tests).

## Stack

Vite, TypeScript and GSAP (ScrollTrigger, SplitText). No UI framework. Geist fonts self-hosted through Fontsource, icons from Phosphor.

## Scripts

```bash
npm run dev        # development server
npm run test       # Vitest
npm run typecheck  # tsc --noEmit
npm run build      # type check and production build into dist/
```

## Structure

- `index.html`: all the content, in plain markup.
- `src/main.ts`: demo wiring, copy button and motion. Every animation is skipped under `prefers-reduced-motion`.
- `src/style.css`: tokens and layout.
- `src/lib/`: pure logic and its tests.
- `public/captures/`: captures of the demos, taken with Playwright, and the Fittë app screens.
- `scripts/og.html`: source of the social preview image `public/og.png`.

## Deploy

Vercel builds `main` (`npm run build`, output `dist`). Pull requests get a preview URL.
