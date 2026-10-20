# pixijs-3d-labs

Labs to play with PixiJS 3D — small, self-contained 3D scenes and 2D+3D hybrids, one route per lab. Rendered WebGPU-first, WebGL fallback. Source open.

**Live at [labs.daniheras.dev](https://labs.daniheras.dev)**

## The labs

| # | Lab | What it plays with |
| - | --- | ------------------ |
| 01 | [`hello-cube`](https://labs.daniheras.dev/labs/hello-cube/) | The smallest honest scene: a rounded cube spinning under the house light rig. First contact with `@pixi/3d` — `View3D`, `Mesh3D`, `Material3D`. |
| 02 | [`voxel-wall`](https://labs.daniheras.dev/labs/voxel-wall/) | A floating sphere demolishes a voxel wall under [Rapier](https://rapier.rs) physics. The choreography is baked headless into a deterministic timeline, then played back with pause / loop / scrub for free. |
| 03 | [`ak47`](https://labs.daniheras.dev/labs/ak47/) | First lab fed by a real asset: an FBX-sourced AK-47 rebuilt as a PBR GLB. Turntable drag, hover reveals, and a failing filament bulb overhead. |

Each lab is a page under [`src/pages/labs/`](src/pages/labs/) mounting a scene from [`src/labs/`](src/labs/).

## Stack

- [Astro](https://astro.build) 7 — landing, lab routes, zero-JS shell around each scene
- [PixiJS](https://pixijs.com) 8 + [`@pixi/3d`](https://github.com/pixijs) beta — rendering
- [@dimforge/rapier3d-compat](https://rapier.rs) — physics (lab 02, baked headless)
- JetBrains Mono variable — the type of the house
- [Wrangler](https://developers.cloudflare.com/workers/) — deployed as static assets on Cloudflare Workers

> **Note:** the `@pixi/3d` beta ships as a local tarball (`pixi-3d-0.1.0-beta.2.tgz`) referenced by `package.json`. It must be present in the repo root for `npm install` to resolve.

## Structure

```
src/
├── pages/
│   ├── index.astro          # the landing: an index of labs
│   └── labs/                # one route per lab
├── layouts/
│   └── LabLayout.astro      # shared lab chrome (bar, status line, stage)
└── labs/
    ├── core/                # the lab shell: world, theme, geometry, playback
    │   ├── shell.ts         # boots the app, handles ?static / reduced motion
    │   ├── world.ts         # View3D + renderer setup, WebGPU-first
    │   ├── theme.ts         # palette + three-way light rig
    │   ├── geometry/        # shared procedural geometry
    │   └── playback/        # timeline + player for baked takes
    ├── hello-cube/          # config.ts (the numbers) + scene.ts (the wiring)
    ├── voxel-wall/          # + bake.ts (headless Rapier bake)
    └── ak47/
```

Labs follow one rule: **`config.ts` owns every number, `scene.ts` only assembles the scene graph.** See [ADR 0004](docs/adr/0004-labs-folder-architecture.md).

## Getting started

Requires **Node ≥ 22.22**.

```sh
npm install
npm run dev        # http://localhost:4321
```

```sh
npm run build      # static build into ./dist
npm run preview    # serve the build locally
npm run deploy     # build + wrangler deploy (Cloudflare)
```

## Capture mode

Labs support deterministic captures, for screenshots and CI:

- `?static` — renders exactly one fixed-delta frame (one 60 Hz tick), ticker stopped. Labs freeze motion and avoid randomness in this mode.
- `?t=<ms>` — freezes a specific instant (e.g. the bulb flicker in lab 03).

Reduced-motion preferences are honored everywhere: labs hold their pose instead of animating.

## Architecture decisions

Recorded as ADRs in [`docs/adr/`](docs/adr/):

- [0001 — Shared lab shell](docs/adr/0001-shared-lab-shell.md)
- [0002 — Baked playback player](docs/adr/0002-baked-playback-player.md)
- [0003 — Cloudflare Workers deploy](docs/adr/0003-cloudflare-workers-deploy.md)
- [0004 — Labs folder architecture](docs/adr/0004-labs-folder-architecture.md)
