# Index → lab page transitions

Status: resolved
Type: prototype

## Question

What transitions carry the visitor from the index to a lab page (and back)?

Design the two-way motion between `src/pages/index.astro` and the lab page (`/labs/<slug>/`; direction locked in ticket 07: standing inverted band + floating unframed scene). Candidate signature: the clicked row's standing inversion morphs into the lab page's standing band (shared-element feel via Astro view transitions, per-row `view-transition-name`), while suffix, ghost numeral, and scene cross-fade into place; on back, the band returns to its row.

Decide: what morphs vs what cross-fades; durations/curves within the world's rules (one orchestrated entrance, 360ms ease-out / 60ms stagger; every state change after load answers instantly); reduced-motion fallback (opacity-only); 720px behavior.

Mechanism note: Astro `<ClientRouter />` (`astro:transitions`) for MPA view transitions; vanilla TS, no UI framework. HITL: build the take, react with the user until settled.

Depends on: ticket 07 (lab page direction, resolved). The lab page's first instance (hello-cube) needs to exist for the real transition; a labeled placeholder scene is acceptable for the prototype if the beta wiring is not ready.

## Answer

**Locked and shipped: shared-element morph via Astro view transitions (`<ClientRouter />`), user-validated live.**

- **Mechanism:** index rows carry per-row `view-transition-name: lab-<n>`; the lab's standing band carries the matching name. The browser morphs the clicked row's rect into the full-bleed band (360ms, the world's ease-out `cubic-bezier(0.23, 1, 0.32, 1)`); everything else (intro, status line, ghost) cross-fades in the root pair.
- **Entrance vs morph:** direct loads keep the one orchestrated entrance (fade + 8px rise); arrivals through a transition skip it (`html.swapped` gate set on `astro:after-swap`) — the morph carries the entrance.
- **Back:** symmetric morph, band returns to its row.
- **Reduced motion:** view-transition animations off (instant swap); entrance opacity-only.
- **The lab page is real:** hello-cube built per ticket 07's contract (`src/pages/labs/hello-cube.astro`) with the actual `@pixi/3d` 0.1.0-beta.2 — tarball downloaded from the mirror release with the user's gh credentials (gitignored as `*.tgz`) — rendering a rounded red cube on a transparent canvas, floating on the clean ink ground. Rounded-box generator: `src/labs/rounded-box.ts` (first shared-shell candidate, ticket 04).
- **Bugs found and fixed en route:** (1) page scripts run once per session under ClientRouter — second visit rendered nothing; fixed with the canonical lifecycle (init on `astro:page-load`, destroy on `astro:before-swap`); the index keyboard nav had the same latent bug (stale row list) and now re-queries per press. (2) The rounded-box generator mapped each face at half extent (missing factor 2 in the grid step) — caught by a numeric edge-coincidence test, not by eye; all math assertions pass.
- **Evidence:** `.impeccable/review/lab-hello-cube-{desktop,mobile}.png`; detector clean apart from 5 advisory font-size notes (the lab band's intentional steps, recorded in the surface contract).

