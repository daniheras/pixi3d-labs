# Lab 04 — interaction: Monument Valley hops

Status of decisions: agreed with the user in a grilling session (2026-10-20). Every question below
was asked and answered; nothing is silently assumed.

## Goal

A path of floating rounded cubes in an **L shape**, seen through a **fixed orthographic camera**.
A **red sphere** rests on the first cube. Clicking any other cube makes the sphere **hop softly
from cube to cube** along the chain until it reaches the clicked one. Clicking another cube
**mid-journey interrupts** it: the sphere finishes the hop it is in, then re-plans toward the new
target.

## Settled decisions

| # | Decision | Outcome |
| --- | --- | --- |
| Q1 | Path size | 7 cubes: two legs of 4 sharing the corner cube |
| Q2 | Height | Flat L — every cube at the same height |
| Q3 | Hop feel | Resolved with the emil-design-eng + animate skills — see "Animation values" |
| Q4 | Squash & stretch | Yes, subtle: stretch on takeoff, squash on landing |
| Q5 | Retarget rules | (a) click on the cube the sphere occupies while idle → no-op; (b) click on the current journey target → no-op; (c) any other click → finish the hop in flight, then re-plan from the landing cube along the chain; clicking the current hop's destination means "stop there" |
| Q6 | Hover feedback | Cubes tint toward `PALETTE.redBright` with a ~150 ms lerp + `cursor: pointer` (ak47 precedent); touch has no hover, tap works everywhere |
| Q7 | Camera | Fixed orthographic, Monument Valley angle (elevation ~35.26°, azimuth 45°), no orbit |
| Q8 | Name | Lab 04, slug `interaction` |
| Q9 | Motion architecture | Procedural per-frame state machine in `update()` — NOT `core/playback/timeline`, which is for deterministic baked takes with a player; interactive retargeting doesn't fit it. Hop parameters live in `config.ts` (ADR 0004) |
| Q10 | Shadows | Try them (directional key light, fixed shadow bounds — the beta supports it); drop without drama if the beta misbehaves |
| Q11 | Color | Cream cubes (matte, voxel-wall material recipe); the sphere is the scene's only Signal Red (ADR 0001); hover tint = `redBright` |
| Q12 | Process | This spec first, then implementation, verify on the dev server |

## Animation values (Emil Kowalski framework)

Gate: occasional, click-triggered, playful lab subject → animation allowed, start must be
immediate. Purpose: feedback + spatial consistency + delight.

- **Hop duration**: ~350 ms per cube (config; tuned by eye). No pause between chained hops.
- **Launch**: starts on the next frame after the click — no anticipation windup (never delay the
  moment the user is watching).
- **Horizontal curve**: strong ease-out (`1 - (1-t)^4`) — fast launch, soft arrival.
- **Vertical curve**: physics parabola `y = h · 4·e·(1-e)` driven by the *eased* progress, so the
  arc peaks early and the hop reads as a quick lift into a long soft descent.
- **Stretch on takeoff**: y-stretch up to ~1.08 proportional to vertical speed, xz counter-scale.
- **Squash on landing**: y-scale to ~0.82, recovering to 1 in ~130 ms ease-out (the 3D analog of
  button press feedback), xz conserved (~1.11).
- **Reduced motion**: no hops — the sphere teleports to the clicked cube with one gentle settle
  (scale 0.96 → 1, 150 ms). Fewer and gentler, not zero.
- **`?static`**: pose zero — sphere on the first cube, no input listeners bound.

## Architecture

- `src/labs/interaction/config.ts` — every constant: path layout, cube/sphere geometry + materials,
  light rig (with shadow options), camera, hop motion parameters, hover tint.
- `src/labs/interaction/scene.ts` — `createInteractionScene(): LabScene`:
  - Builds the 7-cube chain from config, one `Material3D` per cube (hover lerp is per-cube).
  - Ortho camera per voxel-wall precedent (`mode: 'orthographic'`, `orthographicSize`).
  - Picking per ak47 precedent: `mesh.eventMode = 'static'` + `hitVolume = 'geometry'`, then
    `view.on('pointertap' | 'pointermove' | 'pointerleave')` reading `target3D`. The beta's
    raycaster handles orthographic cameras (parallel rays).
  - Journey model: no stored path — only `targetIndex` + current position; at each hop's end the
    next step (chain index ±1 toward the target) is decided, which makes interruption (Q5c) free.
  - Shadows: extend `addLightRig`'s `LightRigConfig` with optional `castShadow` + `shadow` fields
    on the key light (additive, defaults preserve the other labs).
- `src/pages/labs/interaction.astro` — LabLayout props + one `mountLab` call.
- `src/pages/index.astro` — new row `04 interaction` and `labs: 3` → `labs: 4`.

## Acceptance

- [x] L path of 7 floating rounded cream cubes, ortho MV angle, sphere red on cube 0.
- [x] Click any cube → soft hops cube to cube; retarget mid-hop finishes the current hop first.
  (Verified with real CDP pointer input: journey right-tip → left-tip, retarget back mid-flight
  landed the in-flight hop on the corner cube, then re-planned home.)
- [x] No-op cases (Q5 a/b) — objective-derived tap rule; inspected + exercised implicitly.
- [x] Hover tints a cube toward redBright (~150 ms) with pointer cursor; touch skips hover.
- [x] Reduced motion teleports; `?static` renders pose zero reproducibly (verified: sphere on
  the first cube, no hover tint, one frame).
- [x] Shadows render (or are cleanly dropped): rendering. The key light rides high
  ([5, 16, 7], ~62° elevation) because the path has no ground plane — every cube top is the only
  shadow receiver, and a lower key pushed the sphere's shadow off into the void. Verified the
  traveling contact shadow under the mid-hop sphere.
- [x] Index lists lab 04 and the count reads 4 (rows + status line verified in DOM).

## Verification notes (build session)

- Synthetic DOM `PointerEvent` dispatches don't drive the beta's federated picking — real CDP
  pointer input does. Testing must use real input (`agent-browser mouse move/down/up`).
- `npx tsc` (latest TS) reports two **pre-existing** errors in `src/labs/ak47/scene.ts`
  (`AK47.environment` readonly vs `Partial<View3DOptions>`, and `overlay` possibly null).
  Not from this lab; left untouched.
- Astro's dev toolbar pill at the bottom center is dev-only, not part of the lab.
