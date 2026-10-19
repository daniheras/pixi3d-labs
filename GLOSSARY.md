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
