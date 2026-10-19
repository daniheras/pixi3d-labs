---
version: 1
slug: "src-pages-labs-hello-cube-astro"
primary_target: "src/pages/labs/hello-cube.astro"
related_targets: ["src/pages/labs/2d3d-hybrid.astro"]
---

# Surface brief — lab page (src/pages/labs/hello-cube.astro)

Scope: the lab page surface shared by every lab (`/labs/<slug>/`; first instances: hello-cube, 2d3d-hybrid). Visitor mode: **Experience** — the running lab leads from the first pixel; the interface recedes.

## Audience / job / action

Community peers arriving from the index or shared links. Job: watch the lab run and understand immediately that it is live and touchable. Primary action: experience the demo; secondary: read the source (source link in the band), return to the index.

## Constraints

World fixed by DESIGN.md (Typographic Billboard): ink #0b0908 ground, Signal Red #e5483c, JetBrains Mono only, flat, square, inverse bands, hairlines. No cut with the index (user-pinned): same voice, same grammar. User-pinned for this surface: the 3D scene floats centered on the clean ground — no frame, border, ticks, or canvas affordance announcing that a canvas renders there (the 4:3 framed-viewport norm was retracted by the user before the build). Shell carries only: back to index, source link, status-line metadata (beta honesty lives there). Copy in English.

## Chosen direction

**Standing Row** (user-locked as option 2 of the dealt hand; amended by user steer: the dealt card's red-ruled demo frame is dropped — the scene floats on the ground). The lab's own index row stands inverted at the top (full-bleed red band: ink numeral chip, ink name, suffix, blinking block cursor, back + source inside the band); beneath, the live scene floats centered on ink; status line pinned at the bottom edge.

## Direction contract

THESIS: the row you clicked never left — the lab opens as its own index row standing inverted, and the scene floats free beneath it; refusing both the framed-player default and any canvas-chrome look.
OWN-WORLD: ink ground; the standing red band owns the top; red reappears only in the scene itself, the block cursor, and the status line; cream/ink type; the only hairline sits above the status line; nothing ever borders the demo.
STORY: the visitor understands "the lab is running and it is touchable", believes the beta is real and the source is open, and plays with it.
FIRST VIEWPORT: full-bleed red band (~150px): 76px ink chip with bright-red numeral, name at poster weight (~72px, ink, −0.035em), suffix, blinking ink cursor, `← index` + `source ↗` right-aligned inside the band; below, the live 3D scene centered on clean ink — no frame, no labels, no ticks; status line pinned at the bottom edge (`lab: 01 · status: beta · webgpu-first · webgl fallback`, github ↗ right).
FORM: Standing Row (grounded candidate 1, dealt third of the hand; locked as option 2 with user steer: unframed floating scene; seed:3cae6c050dcbb1cb).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved

- Shell/per-lab code boundary (ticket 04) — decides what lives in the page vs the shared shell.
- Scene content per lab (ticket 05); hello-cube is the first instance.
