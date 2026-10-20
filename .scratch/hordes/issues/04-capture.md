# Ticket 04 — capture: ?static seeding, OG capture, glossary

`Status:` resolved

Part of the `hordes` lab (see `.scratch/hordes/spec.md`, normative).

## Goal

Ship the perf-lab story end to end once the game runs (tickets 01–03): a good OG image
and the terminology recorded.

## Deliverables

- **`?static` seeding** inside `scene.setup`: when `ctx.static` is set, deterministically
  seed ~300 enemies + in-flight bullets + 1 pickup around the arena center before the
  single fixed-delta frame renders — seedable, no nondeterminism (capture commit-once
  contract), so the OG shows a mid-horde frame instead of an empty arena.
- **OG capture**: generate `/og/Hordes.png` (or per `scripts/capture-og.mjs` convention)
  against a local dev server (`astro dev --background` per repo AGENTS.md).
- **`GLOSSARY.md`** entries for new domain terms, e.g. *Horde lab*, *Spawn director*,
  *Fire director*, *Dying state*, *Entity cap*, *Spatial hash grid*, *Synthetic seeding*.
- Optional: a one-line README/issue note of how to drive the lab (URL, controls, HUD).

## Answer

- **`?static` seeding**: `seedStaticFrame` (spawn.ts) fills the deterministic mid-horde
  frame — ~300 enemies in a seeded ring around the player with scattered ramp ages, 24
  in-flight bullets, 1 pickup. HUD hidden in static (a capture shows the game, not the
  readout). Verified visually: the 1200×630 shot reads as the game mid-fight.
- **OG capture**: added to `scripts/capture-og.mjs` SHOTS; `astro build` + preview +
  system chromium captured `public/og/hordes.png` (also refreshed the other labs' cards
  along the run — same script, same flags).
- **`GLOSSARY.md`** gained the new vocabulary: Horde lab, ECS world/bundle, Mesh pool,
  Spawn director / Fire director, Dying state, Entity cap, Spatial hash grid, Boost
  volley, Synthetic seeding.
- **Spec synced with the user's live decisions**: no floor/walls (void-only), ortho
  camera, spawn batch 4 +1/20s (level from the game clock — the old parallel level
  timer never leveled), boost volley of 8 directions replacing the ×2.5 cadence
  multiplier, mesh-only visual scales, HUD hidden in static, diagnostic axis notes for
  WASD.
