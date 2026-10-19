# pixijs-3d-labs plan

## Destination

A documented plan (no implementation code) for `pixijs-3d-labs`: an Astro landing page linking to a set of PixiJS 3D beta labs — small self-contained demos and 2D+3D hybrids — each lab on its own route (`/labs/<slug>/`) with a static screenshot preview. The plan covers the landing page, the shared lab shell, and the first two labs (a "hello cube" and a 2D+3D hybrid).

## Notes

- **Domain**: single-context repo. Maintain `GLOSSARY.md` at the root and ADRs in `docs/adr/` via the domain-modeling skill as terms and decisions resolve.
- **Skills every session should consult**: `domain-modeling`, `grilling`, `prototype`, `research`.
- **Tracker**: local markdown under `.scratch/pixijs-3d-labs-plan/`.
- **Language**: all external output in English (per AGENTS.md).
- **Standing decisions** (settled while charting): beta access is in hand; labs are small self-contained demos + 2D+3D hybrids; portfolio/showcase audience; one route per lab; TS vanilla + a shared shell (no framework); static screenshot previews; first two labs are "hello cube" and a 2D+3D hybrid.
- **Landing aesthetic**: RESOLVED via ticket 03 — "Editorial Mono Index — bolder"; the world (TUI as material, red dominant, mono only) is recorded in `DESIGN.md`; direction contract in `.impeccable/surfaces/src-pages-index-astro.md`.
- **Beta is a closed invite** (private repo, no public API); ticket 06 captures the API surface once the user shares access.
- **Implementation is out of scope** for this map (see Out of scope).

## Decisions so far

- [PixiJS 3D beta: delivery and API surface](issues/01-research-pixi3d-beta-api.md): closed invite, private repo, no public API; code-level API requires access (→ ticket 06).
- [Editorial Mono Index — bolder (landing design)](issues/03-prototype-landing-design.md): the index IS the interface — poster-scale mono rows, red numeral squares, full-bleed inverse-video hover; built at `src/pages/index.astro`; world recorded in `DESIGN.md`.
- [Static preview screenshots for WebGL labs](issues/02-research-static-previews.md): commit-once Playwright capture via `renderer.extract`/`page.screenshot`, no build-time regen.
- [Share PixiJS 3D beta access and capture the API surface](issues/06-task-share-beta-access.md): `@pixi/3d@0.1.0-beta.2` (tarball install); `View3D` is a 2D container rendering a 3D scene; core API + hello-cube pattern captured.

## Not yet specified

- Deployment target (Vercel / Netlify / GitHub Pages) — decide once the plan's build story is clear.
- Bundle / perf strategy for the beta (lazy backend chunks, per-lab code-splitting) — pin once the plan's build story is clear.
- Additional labs beyond the first two — graduates once the first two specs exist.

## Out of scope

- Actually building / implementing the landing page and labs — the destination is the plan only; implementation is a fresh effort once the plan is locked.
- Evaluating 3D-engine alternatives (Three.js, pixi3d) — beta access is in hand and the plan commits to the PixiJS 3D beta.
- A full brand identity / design system — the plan includes design *direction*, not a finished design.
