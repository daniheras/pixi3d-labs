# Spec: Lab 05 — `hordes`

`Status:` accepted (grilled round-by-round; user signed off)

A bitecs-driven survival stress-test lab: a mini vampire-survivors where thousands of
entities pour in from the arena edges and the point of the lab is to **measure** how far
PixiJS 3D + bitecs go before the frame budget breaks. Every gameplay constant below is a
tuned default living typed in `config.ts` as data (ADR 0004 style), not a magic number.

## Identity

- Number: **05** (next slot in the `labs` array of `src/pages/index.astro`).
- Slug / folder: `hordes` → `src/labs/hordes/`.
- Suffix (short): *bitecs survival stress test*.
- OG capture: `scripts/capture-og.mjs` flow, `og/${name}.png`.

## Architecture

- **bitecs is an npm dependency, confined to this lab.** `src/labs/core/` is not touched;
  all ECS code lives in `src/labs/hordes/ecs/` (components + systems), architected cleanly
  within the folder, with no reuse pretense across labs.
- **Full ECS gameplay**: components `Player`, `Enemy`, `Bullet`, `Pickup`, `Transform`,
  `Velocity`, `Lifetime`, `Dying`; pure systems only (input→velocity, seek, spawn director,
  fire director, collisions, damage/cleanup, pickup effect). bitecs owns the logic; Pixi
  purely renders by reading component tables each frame.
- **Render mapping: one `Mesh3D` per entity**, geometry shared, per-entity pooled
  materials — no custom instancing/batching. Measuring `@pixi/3d` as-is is the point; an
  instanced renderer would distort what this lab measures (candidate for a future lab).
- All meshes come from **preallocated pools**.

## World

Revised live with the user while testing (the §"Decisions" notes below record each).

- **No arena visuals at all**: no floor, no walls — entities float in the dark against the ink void. The arena exists only in physics: the player is clamped to an 80×80 square; enemies spawn just outside those bounds.
- **Orthographic camera**: `Camera3D` mode `'orthographic'`, `orthographicSize` 55 (half the view width in world units), fixed position above the arena — the whole playfield readable at once, zero foreshortening.
- **Mesh-only visual scales** (`config.visual`) sit on the physics: bigger shapes on screen (player ×1.4, enemy ×1.4, bullet ×1.5, pickup ×1.4) with the collision radii unchanged — visuals slightly generous, physics honest.
- Visual theme: existing `theme.ts` palette (Signal Red player, cream enemies and bullets) plus one local yellow for the pickups; `addLightRig` for the three-way light.

## Gameplay contract

Rendering note for readers: the tuning table at the end of this section is normative.

- Player: controlled with **WASD + arrow keys**, no touch support.
- Enemies: rounded cubes (~0.7 scale) spawn **instantly** — no entrance animation — at a
  random point along one of the 4 walls, a few units just outside the arena, velocity from
  spawn already aimed at the player; fixed-seek straight-line chase after that.
- Enemies **overlap freely**; no separation/steering whatsoever. Swarm separation for
  thousands of entities is exactly the kind of cost this lab does not pretend to sustain —
  direct seek + overlaps is the honest stress contract.
- Bullets: fixed direction at fire time toward the **nearest enemy within a 16u threshold**
  (no homing, no re-target). ~0.35 radius, 26 u/s, 2s lifetime; kills exactly 1 enemy, then
  the bullet dies. If the enemy moved and the bullet passes through empty space, it keeps
  flying until lifetime expires.
- Player: 5 lives; on losing all lives → **internal lab-owned game over** — ~1s "GAME OVER"
  HUD banner, then the lab tears down and rebuilds its own ECS world + pools + HUD (same
  internal builder function `setup` uses for the world) ramping difficulty and lives from
  zero again. The `Application`, canvas, and shell never notice; no re-entry/`astro:page-load` magic.
- Player hit: invulnerable 1s after any hit, with player material flash + blinking
  during invulnerability, no knockback.
- **Boost (revised live with the user)**: grabbing a yellow pickup makes the player fire
  in 8 directions at once — each shot becomes a radial volley of 8 bullets (spoke 0 at
  the nearest-enemy aim, 45° apart), cadence unchanged, for 6s. The retired
  "×2.5 fire-rate" semantics is out.
- Pickups: yellow spheres (~1.2 diameter); spawn chance every 10s, max 2 alive; touching one
  gives the **boost** (see below).

## Death FX (bill of specifics)

- Hit by a bullet → enemy enters a **150 ms "dying" state**: material flash on its own
  material + positional **shake** (jitter applied at render time only, does not touch ECS
  physics), then recycles to the pool. Enemies are 1-hit kills, so this is their one and
  only hit.
- **Cap-recycling (oldest enemy) and game reset wipe are instant, with no FX** — otherwise
  the cap would create a visual feedback loop.

## Performance contract

- **Cap: 2 000 enemies alive.** Spawning keeps ramping forever, but the cap hard-recycles
  the oldest enemy without FX. On top of that, declared target: **~2 000 enemies +
  ~300 live bullets at 60 fps on desktop**. The cap makes the test repeatable and bounds memory.
- **Spatial hash grid** for both collision queries (bullet→enemy, enemy→player), cell
  ~4u, rebuilt every frame from the bitecs tables, squared-distance checks (no sqrt).
  Brute force is neither starting nor fallback — it is off the table from day one.
- HUD is **DOM, updated at 4 Hz** from the ticker (downsampled), kept out of the `LabLayout`
  status line, so the HUD itself stays out of the frame budget measurement. Live readout:
  FPS (1s rolling mean), enemy count, bullet count, kills, lives, and the game-over banner.
- Shell status line stays untouched, reporting `backend` as on every lab.

## `?static` capture mode

A frame 0 of this game is an empty arena — a poor OG image. In `?static` mode the spawner
**synthetically seeds** the world before its single fixed-delta frame: ~300 enemies + in-flight
bullets + 1 pickup arranged around the center, deterministic (seedable), so the capture
shows the game mid-horde. No capture-specific lab code beyond the seeding branch, in line
with the shell's commit-once capture contract.

## File layout (plan)

```
src/labs/hordes/
├── scene.ts          # createHordesScene(): LabScene (setup/update/dispose per ADR 0001)
├── config.ts         # typed constants as data (see tuning table)
└── ecs/
    ├── components.ts # Player, Enemy, Bullet, Pickup, Transform, Velocity, Lifetime, Dying
    ├── systems/      # input, seek, spawn director, fire director, collisions, damage/cleanup, pickup
    ├── world.ts      # ECS world + mesh pool construction, per-entity materials
    └── hud.ts        # 4 Hz DOM overlay
src/pages/labs/hordes.astro   # thin page: LabLayout + mountLab
src/pages/index.astro         # labs array gets entry 05
```

## Tuning table (normative defaults)

| Parameter | Value |
|---|---|
| Player speed | 9 u/s, radius 1 (diagonal input normalized) |
| Input | WASD + arrow keys; mobile gets a floating virtual joystick (analog, spawns under the thumb, touch-pointers only) |
| Enemy scale / speed | ~0.7 / 2.5 u/s, ramping up to 4.5 u/s over 60s per-enemy age |
| Spawn cadence | every 0.8s, batch of 4 initially, **+1 enemy per batch every 20s** (level from the game clock), rotating 4 walls |
| Fire cadence / threshold | every 0.4s; nearest-enemy threshold 16u |
| Bullet | radius ~0.35, visual ×1.5, speed 26 u/s, lifetime 2s, 1 kill then dies |
| Lives / invuln | 5 lives, 1s invulnerability after hit |
| Pickup | ~1.2 diameter (visual ×1.4), spawn chance every 10s, max 2 alive → boost: 8-way volley per shot for 6s |
| Entity cap | 2 000 enemies (oldest recycled, no FX) |
| Camera | orthographic, orthographicSize 55, fixed above the arena |
| Death FX | 150ms dying state: material flash + positional shake, then recycle |
| Collision grid | spatial hash, cell ~4u, rebuilt every frame, squared distances |
| HUD | DOM overlay, 4 Hz refresh, FPS(1s mean)/enemies/bullets/kills/lives + game-over banner; hidden in ?static |

## Out of scope (deliberate)

- No swarm separation/steering between enemies.
- No instancing/batching renderer.
- No camera follow.
- No bullet re-targeting or homing.
- No HP for enemies (1-hit kills; if shielded/hp design ever wanted, that is another lab).
