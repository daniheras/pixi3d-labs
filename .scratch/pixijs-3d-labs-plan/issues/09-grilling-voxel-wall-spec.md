# Lab 02 spec: voxel-wall physics demolition with a reusable player

Status: resolved
Type: grilling
Supersedes: lab 02 portion of ticket 05 (views-in-2d deferred to a future batch)

## Question

What is the concrete spec for lab 02 — a voxel wall with physics that a floating sphere demolishes organically, looping 5s after the collapse, with a progress-bar/pause/resume player built for reuse?

PixiJS ships no physics (nor does the beta), so an external engine must be chosen; and the player must be reusable across labs.

## Answer

Decided in a grilling session (2026-10-19; 11 questions in two rounds, all recommendations accepted, user-confirmed). Spec pins shape and constraints; recorded values are starting points, tuned at implementation (per ticket 05's precision rule).

### Scope

- **Lab 02 is `voxel-wall`** (route `/labs/voxel-wall/`), superseding views-in-2d. The index row is rewritten (name, suffix, route). **views-in-2d is deferred, not dropped** — it graduates to a future batch.

### Physics engine

- **`@dimforge/rapier3d-compat`**: WASM, deterministic, handles a ~100-body wall comfortably; WASM lazy-loadable. cannon-es rejected (pure JS, jittery/costly at this body count); hand-rolled rejected (an organic tumbling collapse wants a real solver).

### Playback architecture — the crux

- **Baked recording, not live simulation.** At init the full choreography is simulated headless in Rapier at fixed 60 Hz and recorded as per-tick poses; playback only samples the recording. Play/pause/loop are trivial, 100% deterministic across devices, and scrub comes almost free.
- **Reusable player over a `TimelineSource` seam**: `src/labs/player.ts` exports a pure controller — `playing/paused/holding` state machine, loop+hold config, progress 0–1, events (`tick`/`phase`/`loop`), `play/pause/toggle/seek` — plus a `mountPlayerUI(host, player, opts)` helper. The controller knows nothing of physics or the shell; any lab that can produce a pose timeline (Rapier recording today, hand-authored keyframes tomorrow) can drive it.

### Shared shell

- The ticket 04 / ADR 0001 shell (**`LabLayout.astro` + `src/labs/shell.ts`**: `mountLab(host, scene)`, `createView3D`, `?static` mode, `[data-lab-backend]` reporting) is extracted as part of this lab; hello-cube migrates onto it. The layout only reserves an optional player-bar slot the lab page declares.

### Choreography

- **Phases**: approach → impact → settle → 5s settled hold, all inside the loop; progress bar spans the full cycle; reset by **cut to pose zero**, then loop forever.
- **Sphere**: kinematic float-in (scripted path, subtle bob, no gravity), handing off to a dynamic body at impact so the solver scatters it with the rubble.

### Scene

- **Composition**: wall ~9×5×2 voxels (≈90 bodies, starting value) using the existing rounded-box geometry; cream/bone voxels on the ink environment; **Signal Red sphere** as the only red subject (ADR 0001's subject's-privilege rule — a red wall would invert the Signal Rule at poster scale); warm light rig as hello-cube.
- **Camera**: fixed cinematic 3/4, no orbit (choreographed action; orbit would fight the loop and the view transitions).

### Controls

- Mono text button (`pause`/`resume`); 1px hairline progress bar with red fill; **drag-scrub** on the bar (fine pointers); `space` toggles; TUI **phase readout** in the status line (`phase: approach · impact · settled`) driven by player events — which also demonstrates the events API. No icons, one typeface (DESIGN.md).

### Motion policy

- **Reduced-motion and `?static` freeze at pose zero**, player visible and paused; autoplay only when motion is allowed. Carries ticket 05's cross-lab policy forward; the settled-rubble `?static` frame was considered and rejected (consistency + capture determinism win).

## Comments

- **2026-10-19 (implementation)** — Shipped as specified. Files: `src/layouts/LabLayout.astro` + `src/labs/shell.ts` (ticket 04 shell extracted; hello-cube migrated), `src/labs/timeline.ts` (`TimelineSource` + `RecordingTimeline`), `src/labs/player.ts` (controller + `mountPlayerUI`), `src/labs/voxel-wall.ts` (bake + scene), `src/labs/geometry.ts` (rounded-box moved here per ticket 04), `src/pages/labs/voxel-wall.astro`, index row rewritten. Recorded as ADR 0002; terms in GLOSSARY.md.
  - **Implementation findings baked into the choreography**: the stack must be pre-settled (~90 discarded steps) before recording and the solver's sleep disabled (`setCanSleep(false)`) — recorded from freshly-coplanar contacts, the impact solves as a slide-and-freeze with top rows suspended instead of a topple. The sphere carries damping (0.6) so the bake reaches genuine rest (~4.5s post-impact); its restitución is 0 (the pile gives the bounce). Final take: 87/90 voxels into the rubble heap, 2 left standing, timeline ≈ 11.9s (1.4s float + ~4.5s settle + 5s hold).
  - **User-directed adjustments (same day)**: the sphere hits the wall's WIDE face (9×5, along +z → -z, slightly off-center at x=-1.2) instead of the thin 2×5 end — at the wide face the knockdown needs more energy, so the float runs at speed 10, density 30, low (y=1.9, undermining the base). The visual floor is gone per user: the ground is physics-only, and the wall, sphere and rubble float on the ink void.
  - **`onFrame`/`onLoop`/`onPhaseChange` are subscription sets** returning an unsubscriber — the UI's renderer must not mute the lab's pose applier (a single-slot API did exactly that; caught by live transform probing).
  - **Dev/capture affordance added**: `?t=<ms>` freezes the take at any instant (paused, deterministic) — how the mid-collapse frames were verified and photographed.
  - **`mountLab` keeps one scene per pathname**: with ClientRouter every page's module lives for the session, so a single-slot shell mounted the wrong scene on cross-lab re-entry.
  - **Known lever**: the lab chunk is ~4.2MB (Rapier compat inlines WASM as base64), page-scoped and lazy; streaming `@dimforge/rapier3d`'s raw WASM would cut it if it ever hurts (map: bundle/perf strategy).
