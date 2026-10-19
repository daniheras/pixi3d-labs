# Labs folder architecture: per-lab folders, a core/ for shared infra, config as data

As the lab count grows (and the pure-3D labs coexist with 2D+3D hybrids), the flat
`src/labs/` mixed three kinds of code indistinguishably: shared infrastructure
(`shell.ts`, `geometry.ts`, `timeline.ts`, `player.ts`), lab scenes
(`hello-cube.ts`, `voxel-wall.ts`), and tuned-looking constants sitting in the middle of
both scenes. We decided on a **per-lab folder + `core/` split**:

```
src/labs/
├── core/                     shared infrastructure, no lab semantics
│   ├── shell.ts              mountLab lifecycle (ADR 0001)
│   ├── world.ts              createView3D + the world-defaults config
│   ├── theme.ts              the house palette (PALETTE) + the addLightRig helper
│   ├── geometry/rounded-box.ts
│   └── playback/
│       ├── timeline.ts       TimelineSource seam (ADR 0002)
│       └── player.ts         controller + mountPlayerUI (ADR 0002)
├── hello-cube/
│   ├── scene.ts              the LabScene
│   └── config.ts             cube, lights, camera, motion — as data
└── voxel-wall/
    ├── scene.ts              the LabScene and playback wiring
    ├── bake.ts               the headless Rapier bake
    └── config.ts             the demolition choreography + skin, as data
```

Pages stay thin (`src/pages/labs/<slug>.astro`) and import
`labs/<slug>/scene.ts` + `labs/core/...` explicitly — no convention magic, per ADR 0001.

## Considered options

- **Keep the flat folder** — worked at two labs, but every new lab would add another
  sibling cluster of scene+config files and readers had to open files to tell shared
  from lab-owned. Rejected.
- **Config inline in scene files** — the constants are part of the code's meaning, but
  they are *tuned values* (bake-tuned, ticket-tuned): the one thing worth isolating when
  re-tuning or diffing a change. Extracted as typed, documented data objects per lab.
  Rejected for scene files; chosen for `config.ts`.

## Consequences

- **sha​red vs. lab-owned is visible from the tree**: `core/` means "no lab semantics";
  a lab folder means "this demo only".
- **Both labs now derive their light rig from the same `addLightRig` helper** with
  per-lab poses and intensities in config — the house look is data, not duplicated
  scene-graph code.
- **The choreography constants down-derive**: `voxel-wall`'s sphere geometry radius and
  voxel geometry size come from the choreography object, so the skin cannot drift from
  the bake.
- This **supersedes ADR 0001's path line** ("scene modules at `src/labs/<slug>.ts`") —
  scene modules now live at `src/labs/<slug>/scene.ts`; the *decisions* (scene objects,
  `mountLab`, lab-owned View3Ds, no name convention) are unchanged.
