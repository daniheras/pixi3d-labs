# Lab page design direction

Status: resolved
Type: prototype

## Question

What is the design direction for the individual lab page (`/labs/<slug>/`)?

Produce a rough take (layout + visual style) for the page that hosts a lab: the shared shell around the live canvas — back link to the index, lab numeral/title, status line, where the preview fits vs. the live demo, loading/empty state — consistent with the locked landing direction ("Editorial Mono Index — bolder", see `DESIGN.md`). HITL: react with the user until the direction is settled.

Design direction given so far: the TUI world from `DESIGN.md` (near-black warm ground `#0b0908`, Signal Red `#e5483c`, JetBrains Mono only), worn as material, not terminal cosplay. The lab page must read as the same publication as the index, with the live canvas as the hero content.

Boundary note: this ticket decides the *design direction* of the lab page surface; the shell/per-lab code boundary is ticket 04's question.

## Answer

**Direction locked: "Standing Row" — amended by user steer.** The lab page opens with the lab's own index row standing inverted (full-bleed Signal Red band: ink numeral chip, ink name, suffix, blinking block cursor, `← index` + `source ↗` inside the band); beneath it the live 3D scene floats centered on the clean ink ground — no frame, border, ticks, or canvas affordances; status line pinned at the bottom edge (`lab: 01 · status: beta`, github right).

User verdicts on the dealt hand: Standing Row (option 2) locked; the pinned 4:3 framed-viewport norm was retracted before the build ("no quedó como yo creía") — the scene must never read as a canvas mounted on the page. The norm was removed from PRODUCT.md.

- Direction contract: surface brief for the lab page (primary `src/pages/labs/hello-cube.astro`, related `src/pages/labs/2d3d-hybrid.astro`).
- Hand sketches: `.impeccable/mocks/decision/{standing-row,gallery-plate,instrument-bench}.html`.

