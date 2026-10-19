# Share PixiJS 3D beta access and capture the API surface

Status: resolved
Type: task

## Question

The beta API is private (see ticket 01). To specify the lab shell (ticket 04) and the first labs (ticket 05), we need the user to share beta access and capture the API surface: the repo invite / install method, and code-level answers for mesh / light / camera / materials / ticker / 2D↔3D composition.

HITL checklist for the user:

- [x] Share the beta repo invite URL (or the npm package name if one was provided).
- [x] Confirm the install method (git dependency? npm pre-release?).
- [x] Provide a minimal "hello cube" example from the beta (or point at an example in the repo).
- [x] Note any 2D+3D composition API (how 2D overlays sit with 3D).

Resolved when the agent can read the beta's API from real sources.

## Answer

Access confirmed. Repo: https://github.com/pixijs-userland/pixi-3d-beta (read-only mirror of the private `@pixi/3d`). Package **`@pixi/3d` v`0.1.0-beta.2`**, MIT, peer-dep `pixi.js ^8.22.0`, runtime dep `meshoptimizer`.

### Install

Not on npm yet — install from the release tarball:

```sh
npm install pixi.js
npm install ./pixi-3d-0.1.0-beta.2.tgz
```

Exports: `.` (core), `./extras`, `./webgl`, `./webgpu`.

### Core API

- **`View3D`** — a 2D Container that renders a 3D scene into its rectangle. Options: `width`/`height` (inset) or `autoResize` (fill canvas), `anchor`, `environment: { skyColor, groundColor }`, `toneMapping`. Has `.root` (3D scene graph) and `.camera` (perspective `Camera3D`).
- **`Mesh3D`** — `{ geometry, material }`; **`Model3D`** — glTF via `Assets.load<Scene3DSource>(url)`; also `Sprite3D`, `BatchedMesh3D`, `Container3D`.
- **Geometries**: `CubeGeometry`, `SphereGeometry`, `PlaneGeometry`, `CylinderGeometry`, `ConeGeometry`, `CapsuleGeometry`, `IcosahedronGeometry`, `TorusGeometry`, `TorusKnotGeometry`.
- **Materials**: `Material3D` (PBR: `baseColor`, `metallic`, `roughness`, `transmission`, `ior`, plus clearcoat/sheen/iridescence bits), `PhongMaterial`, `FlatMaterial`. Extras: `ToonMaterial`, `PortalMaterial`.
- **Lights**: `AmbientLight`, `DirectionalLight`, `PointLight`, `SpotLight`.
- **Cameras**: `view3d.camera` (perspective). Extras: `OrbitCamera`, `FPSCamera`.
- **Renderer**: `import '@pixi/3d'` registers lazy backend chunks; static `import '@pixi/3d/webgl'` / `@pixi/3d/webgpu`. `Application.init({ preference: 'webgpu' | 'webgl' })`.

### The 2D+3D model (key for the hybrid lab)

`View3D` **is a 2D container**: you add it to `app.stage` (2D) and it renders a 3D scene into its rectangle, so 2D UI (sprites, Graphics, text, filters) and 3D views coexist in the same 2D stage. `examples/views-in-2d.example.ts` shows several `View3D`s embedded in 2D containers beside 2D sprites/filters (the 2D backdrop even refracts through transmissive 3D glass).

### Hello cube (minimal)

```ts
import { AmbientLight, CubeGeometry, DirectionalLight, Material3D, Mesh3D, View3D } from '@pixi/3d';
import { Application } from 'pixi.js';

const app = new Application();
await app.init({ preference: 'webgpu', resizeTo: window });
document.body.appendChild(app.canvas);

const view3d = new View3D({ autoResize: true, environment: { skyColor: 0xdde8ff, groundColor: 0x443322 } });
app.stage.addChild(view3d);

view3d.root.addChild(new AmbientLight({ color: 0xc8d8ff, intensity: 0.35 }));
const keyLight = new DirectionalLight({ color: 0xfff4e0, intensity: 4 });
keyLight.position.set(4, 5, 6);
keyLight.lookAt({ x: 0, y: 0, z: 0 });
view3d.root.addChild(keyLight);

const cube = new Mesh3D({
  geometry: new CubeGeometry({ width: 1, height: 1, depth: 1 }),
  material: new Material3D({ baseColor: 0xffffff, metallic: 0, roughness: 0.4 }),
});
view3d.root.addChild(cube);

view3d.camera.position.set(2.2, 1.8, 3.2);
view3d.camera.lookAt({ x: 0, y: 0, z: 0 });

app.ticker.add(() => { cube.rotation.y += 0.5 * (app.ticker.deltaMS / 1000); });
```

### Extras (`@pixi/3d/extras`)

`OrbitCamera`, `FPSCamera`, debug tools (`GraphDebugOverlay`, `DepthMapViewer`, …), `ParticleSystem3D` + emitter shapes, post-processing (`BloomEffect`, `SsaoEffect`, `TiltShiftEffect`, `TintEffect`, `OutlinePass`, `PortalPass`, `WireframePass`).

### TypeScript note

`@pixi/3d` ships its own types. WebGPU types: TS5 needs `@webgpu/types` (added by pixi.js); TS6/7 use `@types/web` with `"lib": ["esnext"]`. Relevant when wiring the project's `tsconfig`.
