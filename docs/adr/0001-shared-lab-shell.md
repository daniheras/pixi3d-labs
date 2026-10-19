# Shared lab shell: single mount entry, scene objects, no shell-owned View3D

Every lab repeats the same renderer lifecycle (pixi Application init, canvas mounting, Astro ClientRouter re-entry/teardown — the source of a real re-entry bug) and the same page chrome. We decided the shared shell is two layers — a document-owning Astro layout (`src/layouts/LabLayout.astro`) and a TS renderer module (`src/labs/shell.ts`) whose single entry `mountLab(host, scene)` owns the whole lifecycle. Labs are described as scene objects — required `setup(ctx)`, optional `update(ticker)` and `dispose()` — receiving a context of `{ app, host, backend, reducedMotion, static }`, and they create their own View3D(s) via a `createView3D` helper carrying the world defaults.

## Considered options

- **Exported lifecycle primitives, each lab wiring astro events itself** — rejected: ClientRouter runs page scripts once per session, and that once-per-session re-entry/teardown semantics is exactly what a lab gets wrong (it already produced a bug, fixed in ticket 08). One entry point keeps the subtle part in one place.
- **Shell pre-creates a default View3D (and thus owns the camera)** — rejected: the 2D+3D hybrid lab needs several inset View3Ds beside 2D content; a mandatory default with an opt-out is less uniform than a helper labs call once or N times. Camera placement is scene framing, hence lab code; cleanup stays shell-side for free via `app.destroy`.

## Consequences

- The shell stays minimal: no orbit controls in v1 — adopted only when a lab spec (ticket 05) calls for them.
- Application-level resize is shell-owned (`resizeTo: host`); per-view sizing is the lab's, via the `createView3D` overrides.
- `?static` one-frame mode lives in the shell, so commit-once Playwright captures (ticket 02) are reproducible with zero capture-specific code in labs; the context's `static` flag lets labs avoid randomness when being photographed.
- The status line reports the actually resolved backend through a `[data-lab-backend]` convention, keeping the "webgpu-first · webgl fallback" claim honest.
- The world's hexes are duplicated between the layout's CSS vars and shell defaults — accepted until it hurts. The scene environment defaults to the ink pair (`skyColor: 0x2a1f1a`, `groundColor: 0x0b0908`, as live in hello-cube); red stays in the chrome, out of the scene, per DESIGN.md's signal rule.
