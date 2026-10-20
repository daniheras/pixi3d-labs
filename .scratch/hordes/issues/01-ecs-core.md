# Ticket 01 — ecs-core: config, components, world + pools

`Status:` resolved

Part of the `hordes` lab (see `.scratch/hordes/spec.md`, normative).

## Goal

The self-contained ECS core of the lab: typed constants, bitecs components, and the
preallocated world + mesh-pool construction. No gameplay logic, no systems here.

## Deliverables

- `src/labs/hordes/config.ts` — every constant from the spec's tuning table as typed data.
- `src/labs/hordes/ecs/components.ts` — `Player`, `Enemy`, `Bullet`, `Pickup`,
  `Transform`, `Velocity`, `Lifetime`, `Dying`.
- `src/labs/hordes/ecs/world.ts` — the lab-internal world builder: bitecs world,
  preallocated mesh pools (one `Mesh3D` per slot, **shared geometry, per-entity material
  instance** preassigned at pool build time — flash tint needs it), arena constants.
  Exposes the internal builder that both `setup` and the game-over startup will call.

## Constraints

- bitecs dependency confined to this lab (`core/` untouched).
- English-only code/comments (repo AGENTS.md).
- Follows ADR 0004 folder conventions; constants as data.

## Depends on

Spec sign-off only. Unblocks ticket 02 (systems) and gates ticket 03 (scene glue needs
the pool/world API).

## Answer

Shipped as `config.ts` + `ecs/{components,mesh-pool,rng,world}.ts` with `bitecs ^0.4.0`
(npm's actual latest — the NateTheGreatt rewrite: any reference is a component, SoA
plain-`number[]` stores, marker components for classes, removals deferred to the next
query). Verified against the beta that the scene batch compacts `visible=false` meshes
out of the draw lists, so pools keep every mesh mounted and gate lifetime through
visibility. Teardown: `layer.destroy({ children: true, material: true })` takes the
pooled meshes and their per-entity materials; shared geometries are destroyed explicitly
afterwards, then a sweep zeroes every SoA field — the game-over restart rebuilds from
clean tables. The player's singleton state (lives/timers) lives as SoA fields on the
`Player` marker so damage/fire systems stream it like everything else.

Named instance: the per-entity materials and per-slot pool meshes are in
`MeshPool` (`mesh-pool.ts`); the seeded RNG (`rng.ts`) pins `?static` capture frames.
`DirectorState` (spawn/level/pickup timers, kills, rng) is bundle-owned so systems can
stay pure functions over it.

Out of scope for this ticket: pre-existing `ak47` tsc errors (scene.ts:74 and :305) —
unrelated to hordes, left untouched.
