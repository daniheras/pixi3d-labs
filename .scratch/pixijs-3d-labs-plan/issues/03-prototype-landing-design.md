# Landing page design direction

Status: resolved
Type: prototype

## Question

What is the design direction for the portfolio landing page?

Produce a rough take (layout + visual style) for the landing page that lists each lab with its preview thumbnail and links to `/labs/<slug>/`. HITL: react with the user until the direction is settled.

Design direction given so far: Omarchy / TUI style, "less is more" (minimal), red as the dominant color.

## Answer

**Direction locked: "Editorial Mono Index — bolder".** Typography at poster scale is the whole interface: two ~92px mono index rows (`01 hello-cube`, `02 2d3d-hybrid`), lab numerals set in solid red squares, full-bleed inverse-video hover (the row becomes a red band), a ghost outline "3D" watermark, and a pinned status line. The TUI world (near-black warm ground `#0b0908`, Signal Red `#e5483c`, JetBrains Mono only) is worn as material, not as terminal cosplay — the user explicitly rejected literal-terminal structures and ASCII art (it rendered broken in real browsers).

Process: three dealt hands on the decision page (ASCII Billboard / Terminal Transcript / File Manager → Terminal Transcript amplified → Web-native hero / Spec Sheets / Editorial Index / Live Cube Hero). The user pinned Editorial Index, steered "bolder, no ASCII cube", and locked the amplified take.

- Built at `src/pages/index.astro` (code-led), JetBrains Mono variable woff2 self-hosted at `public/fonts/`.
- Finish review: verdict `ship` after one fix batch (suffix contrast over the red band raised to ≥4.5:1; mobile suffix wraps bound so no line opens with a separator).
- World recorded in `DESIGN.md` (+ `.impeccable/design.json`); surface contract in `.impeccable/surfaces/src-pages-index-astro.md`; seed `9a082991428ac9c9`.
- Full tournament record (all sketches, payloads, captures) captured on the throwaway branch `prototype/landing-direction`; main keeps only the validated decision.
