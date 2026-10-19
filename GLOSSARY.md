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
