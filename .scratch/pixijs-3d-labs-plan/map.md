# pixijs-3d-labs plan

## Destination

A documented plan (no implementation code) for `pixijs-3d-labs`: an Astro landing page linking to a set of PixiJS 3D beta labs — small self-contained demos and 2D+3D hybrids — each lab on its own route (`/labs/<slug>/`) with a static screenshot preview. The plan covers the landing page, the shared lab shell, and the first two labs (a "hello cube" and a 2D+3D hybrid).

## Notes

- **Domain**: single-context repo. Maintain `GLOSSARY.md` at the root and ADRs in `docs/adr/` via the domain-modeling skill as terms and decisions resolve.
- **Skills every session should consult**: `domain-modeling`, `grilling`, `prototype`, `research`.
- **Tracker**: local markdown under `.scratch/pixijs-3d-labs-plan/`.
- **Language**: all external output in English (per AGENTS.md).
- **Standing decisions** (settled while charting): beta access is in hand; labs are small self-contained demos + 2D+3D hybrids; portfolio/showcase audience; one route per lab; TS vanilla + a shared shell (no framework); static screenshot previews; first two labs were "hello cube" and a 2D+3D hybrid — lab 02 since superseded by the voxel-wall physics demo (ticket 09), views-in-2d deferred to a future batch.
- **Landing aesthetic**: RESOLVED via ticket 03 — "Editorial Mono Index — bolder"; the world (TUI as material, red dominant, mono only) is recorded in `DESIGN.md`; direction contract in `.impeccable/surfaces/src-pages-index-astro.md`.
- **Beta is a closed invite** (private repo, no public API); ticket 06 captures the API surface once the user shares access.
- **Implementation is out of scope** for this map (see Out of scope).

## Decisions so far

- [PixiJS 3D beta: delivery and API surface](issues/01-research-pixi3d-beta-api.md): closed invite, private repo, no public API; code-level API requires access (→ ticket 06).
- [Editorial Mono Index — bolder (landing design)](issues/03-prototype-landing-design.md): the index IS the interface — poster-scale mono rows, red numeral squares, full-bleed inverse-video hover; built at `src/pages/index.astro`; world recorded in `DESIGN.md`.
- [Static preview screenshots for WebGL labs](issues/02-research-static-previews.md): commit-once Playwright capture via `renderer.extract`/`page.screenshot`, no build-time regen.
- [Share PixiJS 3D beta access and capture the API surface](issues/06-task-share-beta-access.md): `@pixi/3d@0.1.0-beta.2` (tarball install); `View3D` is a 2D container rendering a 3D scene; core API + hello-cube pattern captured.
- [Standing Row, unframed (lab page design)](issues/07-prototype-lab-page-design.md): the lab opens as its own index row standing inverted; the live scene floats centered on clean ink — no canvas chrome; the 4:3 framed-viewport norm was retracted by the user before the build.
- [Index → lab view transitions](issues/08-prototype-index-lab-transitions.md): shared-element morph (row → standing band, 360ms world ease-out) via Astro `<ClientRouter />`; hello-cube lab is real — `@pixi/3d` 0.1.0-beta.2 installed from the mirror tarball; rounded-box generator in `src/labs/rounded-box.ts`; re-entry lifecycle fixed (`astro:page-load`/`before-swap`).
- [Shared lab shell API](issues/04-grilling-lab-shell-api.md): two layers — document-owning `src/layouts/LabLayout.astro` + `src/labs/shell.ts` whose `mountLab(host, scene)` owns the renderer lifecycle (init, app-level resize, astro events, dedupe, cleanup, failure line, `?static` capture mode, backend truth via `[data-lab-backend]`); labs are scene objects (`setup`/optional `update`/`dispose`) creating their own View3D(s) via `createView3D` (ink environment defaults, per-view sizing lab-side); camera and reduced-motion policy are lab-side; geometry helpers at `src/labs/geometry.ts`. ADR 0001; unblocks ticket 05.
- [First two labs: spec](issues/05-grilling-first-labs-spec.md): hello-cube (lab 01) is the minimal proof — the prototype scene adopted as spec, red cube as the in-scene subject, hands-off; views-in-2d (lab 02) is the positioning claim — three inset plates in a centered row (metal torus knot, transmissive glass capsule, red toon sphere) with plain mono captions and per-view orbit, no post-processing; both labs freeze at pose zero under reduced motion and for `?static` capture; spec pins shape, implementation owns the decimals. _Lab 02 since superseded by ticket 09; views-in-2d deferred to a future batch._
- [Lab 02 spec: voxel-wall physics demolition](issues/09-grilling-voxel-wall-spec.md): `voxel-wall` (route `/labs/voxel-wall/`) — Rapier compat baked at init into a per-tick pose recording played back by a reusable `src/labs/player.ts` (controller + `mountPlayerUI`, `TimelineSource` seam, drag-scrub, space toggle, phase readout); kinematic sphere hands off to dynamic at impact; fixed 3/4 camera; cream voxels + red sphere; 5s settled hold inside the loop, cut to pose zero; reduced-motion/`?static` freeze at pose zero with the player visible and paused; ticket 04 shell (LabLayout + shell.ts) extracted as part of this lab with hello-cube migrating onto it. **Implemented 2026-10-19** (see the ticket's implementation comment; ADR 0002).

## Not yet specified

- Deployment target (Vercel / Netlify / GitHub Pages) — decide once the plan's build story is clear.
- Bundle / perf strategy for the beta (lazy backend chunks, per-lab code-splitting) — pin once the plan's build story is clear.
- Additional labs beyond the first two — hello-cube (ticket 05) and voxel-wall (ticket 09) are specified; the next batch graduates as its own future effort and hosts the deferred views-in-2d.

## Out of scope

- Actually building / implementing the landing page and labs — the destination is the plan only; implementation is a fresh effort once the plan is locked.
- Evaluating 3D-engine alternatives (Three.js, pixi3d) — beta access is in hand and the plan commits to the PixiJS 3D beta.
- A full brand identity / design system — the plan includes design *direction*, not a finished design.
