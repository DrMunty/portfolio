# Albert Muntal, portfolio

Personal portfolio of Albert Muntal, full-stack developer. It gathers Fittë, Movie's Platform (HAMD), Budget Calculator and Alumni Platform.

The first screen runs the Fittë routine assistant live in the browser, with the same eight steps as the app: experience, days, duration, equipment, complaints, training plan, a preview where exercises can be swapped, and the final details. The rules are ports of the app and the API as pure functions with tests (`src/lib/`): templates, recommended days, the fit rules that swap exercises by equipment and injury area, the plan answers and the volume ramp. Not included: per-exercise plans, the optional AI text and saving. The background is gym equipment drawn on a canvas that reacts to the pointer.

## Languages

English and Spanish, with a switch in the header. English is the default. The language comes from `?lang=es` or `?lang=en` in the URL (handy for a link in the Spanish CV), then from the choice saved by the switch; the browser language is not used. Every string lives in `src/i18n/messages.ts`; a test checks that both languages have the same keys and placeholders and that `index.html` only asks for strings that exist. Exercise names come in both languages from RepDB.

## Stack

Vite, TypeScript and GSAP (ScrollTrigger, SplitText). No UI framework. Archivo (the font of the app, used for everything) self-hosted through Fontsource, interface icons from Phosphor and the gym equipment glyphs from Tabler (the icon family of the app). The look follows the app: neutral near-black and its mint aurora gradient.

## Scripts

```bash
npm run dev        # development server
npm run data       # downloads the exercise library into src/generated/ (runs before dev, build and typecheck)
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

## Exercise data

The exercise library comes from the RepDB free dataset. Its licence allows use inside applications with attribution but forbids republishing the data, or a derived dataset, in a repository, so `src/generated/` is ignored by git and rebuilt from `https://exercise-dataset.com/exercises.json` on every dev, build and deploy. Exercise data by [RepDB](https://repdb.co).

## Deploy

Vercel builds `main` (`npm run build`, output `dist`). Pull requests get a preview URL.
