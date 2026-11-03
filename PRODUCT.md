# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite, TypeScript and GSAP (ScrollTrigger), no UI framework. Logic lives in pure functions with Vitest tests. Fonts self-hosted. Deployed on Vercel from `main`, on the default `*.vercel.app` domain at first; a custom domain comes later.

## Users

Recruiters and engineers (first the Zurich recruiters who asked Albert to stress his programming projects, then Spanish companies) who reach the page from his CV, LinkedIn or GitHub. They skim for a few seconds, then decide whether to open a project or write to him.

## Product Purpose

A personal portfolio for Albert Muntal, a junior full-stack developer based in Spain who is looking for a first technical role. It gathers four projects (Fittë, Movie's Platform, Budget Calculator, Alumni Platform) and links to GitHub, LinkedIn and email. Success: a visitor understands in one screen what he builds and can verify it (live demos, working logic), and writes to him.

## Positioning

Fittë is a real product built alone, with a private backend and more than 280 merged pull requests, and the portfolio runs a shortened version of its routine assistant live in the browser, built from the app's own templates. Few junior portfolios show their own logic running on the first screen.

## Operating Context

Reached from the CV (QR to GitHub), LinkedIn (projects section) and the GitHub profile README. Mostly read on a laptop by recruiters, also on phones from LinkedIn. English page; the CV and LinkedIn also exist in Spanish.

## Capabilities and Constraints

- Four projects. Public demos: Fittë https://beastmode-fitnessapp.vercel.app, HAMD https://movies-hector-albert.vercel.app, Budget Calculator https://projecte2-budget-albert.vercel.app. Alumni Platform has no public demo, only the repo (https://github.com/DrMunty/Projecte1-ITAlumni).
- Repos: Movies-Hector-Albert, Projecte2-Budget, Projecte1-ITAlumni and the profile repo are public. The two Fittë repos are private.
- Contact: al96@hotmail.es, https://github.com/DrMunty, https://www.linkedin.com/in/albert-muntal-perez.
- Never invent figures, customers or personal data; ask. Verified figures: more than 280 merged pull requests across Fittë front and API, CI on every PR.
- The routine templates shown in the assistant come from the Fittë API (`routine-templates.data.ts`), which marks them as provisional until the coach's final ones arrive. The portfolio says they are the templates the app offers today.
- The exercise library of the assistant is the RepDB free dataset: attribution required ("Exercise data by RepDB (repdb.co)", in the footer and the README) and no republishing of the data in a repository, so it is downloaded at build time into a git-ignored folder.
- Domain not decided. No photo of Albert on the page.

## Brand Commitments

The look of the Fittë app: neutral near-black surfaces and its mint aurora gradient (lime top left, turquoise bottom right, black text on it), Archivo for everything, gym equipment as the background motif. Page language: English and Spanish with a switch in the header (English by default, Spanish for Spanish browsers or `?lang=es`). Degree, if shown: Ciencias de la Comunicación. The Fittë wordmark is «Fittë» in running text.

## Evidence on Hand

- Fittë app captures: `~/Desktop/DrMunty-profile/assets/app-fitte.svg` (today, library, gyms map).
- LinkedIn project texts: `~/Desktop/LinkedIn/textos-proyectos-linkedin.md`.
- The routine templates and the recommended-days rule of the Fittë API, ported with tests.
- Captures of the HAMD, Budget and Alumni demos taken with Playwright at build time.
- Absent: testimonials, client work, metrics beyond the PR count, a headshot. Do not fabricate them.

## Product Principles

1. Show, then claim: every claim sits next to something the visitor can open or run.
2. One idea per screen; the work leads, the interface recedes.
3. Honest about scope: private repos, a bootcamp final project and a junior profile are stated plainly.
4. Fast and readable on a phone and with reduced motion, before it is impressive.

## Accessibility & Inclusion

WCAG AA contrast, full keyboard use of the live demo, visible focus, `prefers-reduced-motion` honoured for every animation.
