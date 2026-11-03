# Albert Muntal, portfolio

Personal portfolio of Albert Muntal, full-stack developer. It gathers Fittë, Movie's Platform (HAMD), Budget Calculator and Alumni Platform.

The first screen runs a shortened version of the Fittë routine assistant live in the browser: experience and days per week build the weekly plan from Fittë's own templates (`src/lib/routine-assistant.ts` and `routine-templates.ts`, with tests). The background is gym equipment drawn on a canvas that reacts to the pointer.

## Stack

Vite, TypeScript and GSAP (ScrollTrigger, SplitText). No UI framework. Archivo (the font of the app, used for everything) self-hosted through Fontsource, interface icons from Phosphor and the gym equipment glyphs from Tabler (the icon family of the app). The look follows the app: neutral near-black and its mint aurora gradient.

## Scripts

```bash
npm run dev        # development server
npm run test       # Vitest
npm run typecheck  # tsc --noEmit
npm run build      # type check and production build into dist/
```

## Structure

- `index.html`: all the content, in plain markup.
- `src/main.ts`: wires the pieces in `src/ui/` (assistant, equipment field, project index, motion) and the copy button. Every animation is skipped under `prefers-reduced-motion`.
- `src/style.css`: tokens and layout.
- `src/lib/`: pure logic and its tests.
- `public/captures/`: captures of the demos, taken with Playwright, and the Fittë app screens.
- `scripts/og.html`: source of the social preview image `public/og.png`.

## Deploy

Vercel builds `main` (`npm run build`, output `dist`). Pull requests get a preview URL.
