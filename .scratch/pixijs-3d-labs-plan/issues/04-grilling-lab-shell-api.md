# Shared lab shell API

Status: resolved
Type: grilling
Blocked by: 06

## Question

What is the shared lab shell's API?

Decide the boundary between the shared shell (renderer init, camera, resize, cleanup) and per-lab code. Depends on the beta API (ticket 01).

## Answer

Decided in a grilling session (2026-10-19; 18 questions, all recommendations accepted, user-confirmed). The shared lab shell is **two layers**:

### Layer 1 — Lab Layout (`src/layouts/LabLayout.astro`)

Owns a lab page's entire document: head, fonts, `ClientRouter`, the standing band, the scene host, the status line. A lab page shrinks to ~10 lines of props (num, name, suffix, description; optional `sourceUrl` defaulting to the repo) plus one explicit mount line.

### Layer 2 — Renderer shell (`src/labs/shell.ts`)

```ts
export interface LabContext {
	app: Application;            // initialized pixi Application
	host: HTMLElement;           // element the canvas mounts into
	backend: 'webgpu' | 'webgl'; // actually resolved backend
	reducedMotion: boolean;      // visitor prefers reduced motion
	static: boolean;             // capture mode (?static) — labs must avoid randomness when true
}

export interface LabScene {
	setup(ctx: LabContext): void | Promise<void>; // may be async (Assets.load for glTF)
	update?(ticker: Ticker): void;                // registered by the shell on app.ticker
	dispose?(): void;                             // lab-side cleanup, before app.destroy
}

export function mountLab(host: HTMLElement, scene: LabScene): void;
export function createView3D(app: Application, overrides?: Partial<View3DOptions>): View3D;
```

### The boundary

- **Shell owns**: Application init/destroy; canvas mounting and app-level resize (`resizeTo: host`); the `astro:page-load` / `astro:before-swap` lifecycle including the re-entry dedupe guard (the bug fixed in ticket 08); awaiting async `setup` and starting updates only after it resolves; routing init/setup failures to a styled inline failure line in the scene host; exposing the resolved backend (written into any `[data-lab-backend]` element — the status line reports truth); `?static` deterministic capture mode (exactly one fixed-delta `update`, ticker stopped).
- **Lab owns**: scene contents (lights, meshes); creating its View3D(s) via `createView3D` — defaults `autoResize: true` and the ink environment (`skyColor: 0x2a1f1a`, `groundColor: 0x0b0908`, as live in hello-cube; red stays in the chrome, out of the scene, per DESIGN.md's signal rule), overridable for the hybrid's inset views; per-view sizing follows those same overrides; camera placement; what degrades under reduced motion.
- **Shell does NOT own (v1)**: a pre-created View3D or the camera (uniform for one-view and N-view labs); orbit controls (adopted only when a lab spec calls for them).
- **Separate from the shell**: `src/labs/geometry.ts` for reusable geometry helpers — `rounded-box.ts` moves there, settling the note in its header. Scene modules at `src/labs/<slug>.ts`; thin pages at `src/pages/labs/<slug>.astro` calling `mountLab(...)` explicitly (no name-convention auto-mounting).
- **Accepted duplication**: the world's two hexes (red `#e5483c`, ink `#0b0908`) live in both the `createView3D` defaults and the layout's CSS vars; no shared token file for now.

Recorded as ADR 0001; terms in `GLOSSARY.md`. Unblocks ticket 05 (lab specs author against this contract).
