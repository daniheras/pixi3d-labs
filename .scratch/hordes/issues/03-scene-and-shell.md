# Ticket 03 — scene-and-shell: glue, camera, HUD, page wiring

`Status:` resolved (this session), part of the `hordes` lab
(see `.scratch/hordes/spec.md`, normative).

## Goal

Make `hordes` an actual lab: the `LabScene` object, the visual stage, the full system
loop on the ticker, the 4 Hz HUD, and the page/nav wiring.

## Deliverables

- `src/labs/hordes/scene.ts` — `createHordesScene(): LabScene` per ADR 0001:
  `setup(ctx)` (async-ready, idempotent per shell re-entry contract), `update(ticker)`,
  `dispose()`. Uses `createView3D`, `addLightRig`, existing palette/floor pattern;
  fixed semi-top-down perspective camera seeing the whole 80×80 arena.
- Internal lab-owned game over: lives 0 → ~1 s "GAME OVER" HUD banner → the lab's own
  internal builder teardown/rebuild of ECS world + pools + HUD, difficulty ramp and lives
  from zero; application and shell untouched.
- `src/labs/hordes/ecs/hud.ts` — DOM overlay, refreshed 4 Hz from the ticker
  (downsampled), out of the `[data-lab-phase]` status line: FPS (1s rolling mean),
  enemies, bullets, kills, lives, game-over banner.
- `src/pages/labs/hordes.astro` — thin page per the other labs: `<LabLayout num="05" …>`
  + `mountLab(...createHordesScene())`.
- `src/pages/index.astro` — add entry 05 (`hordes`) to the `labs` array.

## Constraints

- Shell (`core/`) untouched; status line keeps reporting only backend/phase.
- Reduced-motion: degrade blinking/shake if `ctx.reducedMotion` (lab-side decision).

## Depends on

Ticket 01 (world/pool API). In flight in parallel with ticket 02 is fine; final glue
needs ticket 02's systems wired.

## Answer

Shipped as `scene.ts` + `ecs/hud.ts` + thin page `src/pages/labs/hordes.astro` + entry
`05` in `src/pages/index.astro`.

Decisions taken in-scenario (user steered live while testing):

- **Orthographic camera** (user request): `Camera3D mode 'orthographic',
  orthographicSize 55` from config; everything floats in the void — **no floor, no
  walls** (user request) — the arena exists only in physics terms (player clamp).
- **Mesh-only visual scales** (`config.visual`): player 1.4, enemy 1.4, bullet 1.5,
  pickup 1.4 — the view reads with bigger shapes while the collision radii stay as
  tuned (visuals slightly generous, physics honest).
- **Restart verified live**: death → 1 s banner → new world, fresh 5 hearts/zero
  kills — all internal, no shell involvement.
- **WASD axis truth** was verified against the live camera and documented in
  `playerInput`: screen right = +x world, top of screen = −y world (camera on +Z
  looking toward −Z); diagonal input is normalized (√½ on both axes).
- **Spawn-level bug fixed while probing**: the old parallel level-timer only ticked on
  batch frames (never leveled); the batch now derives straight from `elapsed / ramp`
  and the level fields are gone from `DirectorState`.
- HUD is DOM, 4 Hz (`performance.now()` gate), hidden in `?static`; the game-over
  banner is HUD-owned, scene-timed.
- The dark headless-GL timing weirdness (RAF deltas → sim pacing) is a headless
  artifact; logic verified through it, pacing to be trusted on real hardware.
