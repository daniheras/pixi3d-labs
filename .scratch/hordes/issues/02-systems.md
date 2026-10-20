# Ticket 02 — systems: the eight pure systems

`Status:` resolved

Part of the `hordes` lab (see `.scratch/hordes/spec.md`, normative).

## Notes (decisions taken in-scenario)

- fire director keeps cadence under frame overshoot (`timer + interval`, not a fresh
  interval), so long frames don't drop shots.
- Bullet→enemy uses a **swept segment** test (prev→cur position vs enemy center, squared
  point-to-segment distance): at 26 u/s a 60 Hz step moves a bullet ~0.43 u, close to the
  0.75 u hit sum, so per-position checks could strike-through.
- Cap recycle picks the **first non-dying enemy** in the query (dying slots are
  mid-FX); a full-pool-deadlock is impossible because dying lasts 150 ms.
- `pickupRoll` respects maxAlive via the pool (built to exactly that capacity) — a dry
  pool means no pickup that roll.
- The pickup roll is 50% every 10 s per spec ("spawn chance", not a guarantee).

## Goal

All gameplay logic as pure bitecs systems over the components/pools from ticket 01.
Pixi never appears in system code except where a system writes render-side FX state the
renderer reads (dying flash/shake turn-down, material tint changes of the entity's own
per-entity material).

## Deliverables (system-by-system expectations)

- **input → velocity**: WASD + arrows, 9 u/s, clamp to arena, no touch.
- **seek**: enemies steer straight at the player, speed ramping 2.5 → 4.5 u/s over time.
- **spawn director**: 0.8 s cadence, batch 3 initial, +1 per batch every 20 s, alternating
  the 4 walls, instant spawn just outside the arena aimed at the player; hard cap
  2 000 alive — oldest enemy recycled instant, no FX.
- **fire director**: cadence 0.4 s; nearest-enemy within 16 u threshold picks the
  direction; bullet velocity fixed at fire time; yellow pickup → ×2.5 fire rate for 6 s;
  pickup spawn chance every 10 s, max 2 alive.
- **collisions**: spatial hash grid (cell ~4 u, rebuilt each frame), squared distances;
  queries: bullet→enemy, enemy→player.
- **damage/cleanup**: bullet kills exactly 1 enemy + dies; enemy enters 150 ms `Dying`
  (own-material flash + render-side positional jitter, ECS physics untouched), then
  recycles; cap-recycles and game-wipe recycle instantly with no FX; player hit →
  1 s invulnerability, own-material flash + blinking, no knockback, lives count down.
- **pickup effect**: on touch — fire-rate ×2.5 for 6 s; pickup removal.
- **lifetime/cleanup**: bullets expired at 2 s.

## Constraints

- Pure systems, cleanly testable in isolation; no direct `@pixi/3d` imports except the
  own-material FX surface documented in ticket 01's world API.

## Depends on

Ticket 01 done (unblocks it; may proceed in parallel with ticket 03 once 01 lands).

## Answer

Shipped as `ecs/systems/{spatial-hash,player,enemies,spawn,damage,render,step}.ts` +
the `grid`/`elapsed`/`gameOver`/`spawned` additions to `HordeBundle`/`DirectorState`.
`step.ts` fixes the per-tick order (spawns → timers → seek → move → grid rebuild →
fire → collisions → dying clock → expiry); `render.ts` is the only `@pixi/3d` touch
besides the pools, mirroring tables into meshes plus the two render-side FX allowances
(dying jitter, player hurt tint / invuln blink) that degrade under reduced motion.
`stepStatic` seeds the deterministic `?static` frame (ticket 04 tunes its look).
`tsc -p .` clean for hordes; only the pre-existing `ak47` errors remain in the repo.
