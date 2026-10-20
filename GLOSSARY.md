# pixijs-3d-labs

A portfolio of small PixiJS 3D beta labs — self-contained 3D demos and 2D+3D hybrids — behind an editorial-mono index. Single context.

## Language

**Lab**:
A small self-contained demo — pure 3D or a 2D+3D hybrid — living at its own route, `/labs/<slug>/`.
_Avoid_: demo, example, experiment

**Index**:
The landing page that lists the labs as poster-scale rows.
_Avoid_: home, landing page, gallery

**Lab shell**:
The shared foundation every lab builds on: the Lab Layout plus the renderer shell module.
_Avoid_: framework, boilerplate, harness

**Lab Layout**:
The Astro layout that owns a lab page's entire document — head, fonts, transitions, standing band, scene host, status line.
_Avoid_: template, theme, wrapper

**Standing band**:
The full-bleed red header row on a lab page — the index row it morphs from, standing.
_Avoid_: header, hero, banner

**Scene host**:
The empty page region where a lab's canvas mounts.
_Avoid_: stage (`Application.stage` already names pixi's 2D root), viewport, frame

**Lab scene**:
The per-lab object a page mounts, describing what renders and how it animates; it sets up, updates per frame, and optionally cleans up.
_Avoid_: lab code, component, module

**Status line**:
The bottom line of a lab page, reporting the lab number, its status, and the graphics backend actually resolved.
_Avoid_: footer, debug bar

**Static mode**:
The `?static` capture mode: the scene advances exactly one fixed-delta frame and stops, so screenshots are reproducible.
_Avoid_: freeze mode, screenshot mode, paused mode

**Pose zero**:
The scene's initial arrangement — every lab object at its starting transform. Both labs freeze here under reduced motion, and the `?static` capture photographs exactly this frame.
_Avoid_: rest pose, frame zero, initial state

**Player**:
The reusable playback controller (`src/labs/core/playback/player.ts`) plus its UI helper: play/pause/seek/loop over a Timeline, with progress, phases and events. It owns no clock — the lab advances it from the shell's ticker — and knows nothing of physics or rendering.
_Avoid_: reproductor, animation manager, controls

**Timeline**:
A fixed-body-count pose track sampled by time (the `TimelineSource` seam, `src/labs/core/playback/timeline.ts`). Today a physics recording; equally hand-authored keyframes. Anything that can answer "where is every body at t" can drive the Player.
_Avoid_: animation clip, recording format, track

**Bake**:
Headless fixed-step simulation recorded once into a Timeline before playback (lab 02's choreography). Deterministic across devices; pause, loop and scrub become free playback operations.
_Avoid_: pre-render, compile, cache

**Phase**:
A named segment of a Timeline (`approach`, `impact`, `settled`…), reported by the Player and shown in the status line's readout.
_Avoid_: state, stage, step

**Horde lab**:
Lab 05 (`hordes`): the bitecs survival stress test — one player sphere, thousands of chase enemies, an 8-way volley boost, all bounded by an entity cap.
_Avoid_: survivors lab, vampire lab, shooter lab

**ECS world / bundle**:
Lab-confined bitecs world plus its preallocated mesh pools and the director state, built by `createHordeBundle`. `core/` never touches it; the same builder serves setup and the game-over restart.
_Avoid_: scene graph (that's the Pixi side), store, globals

**Mesh pool**:
One `Mesh3D` per slot with its own material instance, all mounted up-front and visible only while a slot is busy — the beta's scene batch compacts hidden meshes out of the draw lists.
_Avoid_: object cache, cloning, on-demand creation

**Spawn director / Fire director**:
The timer-state systems that decide how enemies arrive (batch grows every N seconds, walls rotate in spawn order) and how shots leave the player (nearest-enemy threshold, 8-way volley under boost). They read/write the bundle's DirectorState, never the renderer.
_Avoid_: spawner, turret logic, AI

**Dying state**:
The 150 ms hit-flash window an enemy enters when a bullet lands: own-material tint + render-side positional jitter (ECS physics untouched); recycling happens at expiry. Cap-recycles and game wipes recycle instantly with no FX.
_Avoid_: death animation, corpse, ragdoll

**Entity cap**:
The hard 2 000-alive-enemy bound: once the pool runs dry the oldest non-dying enemy recycles instantly, so the spawn ramp keeps ramping against a bounded, repeatable budget.
_Avoid_: max enemies, limit, kill switch

**Spatial hash grid**:
The rebuilt-every-frame uniform grid the two collision queries and the fire director's nearest-enemy threshold ask — squared distances only, sqrt off the table.
_Avoid_: broadphase, physics grid, octree

**Boost volley**:
What a yellow pickup grants: for its duration every shot leaves as a radial 8-bullet pattern (spoke 0 aimed at the nearest enemy, 45° apart, cadence unchanged).
_Avoid_: spread shot, rapid fire (that was the retired ×2.5 semantics), power-up burst

**Synthetic seeding**:
What `?static` does to this lab instead of photographing an empty arena: the spawn director deterministically seeds ~300 enemies around the player plus bullets in flight and one pickup, then the shell photographs the one fixed-delta frame.
_Avoid_: mocked state, fake world, pre-baked capture
