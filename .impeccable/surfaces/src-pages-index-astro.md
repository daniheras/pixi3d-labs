---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

# Surface brief — landing (src/pages/index.astro)

Scope: the site's single landing surface. Visitor mode: **Experience** — the labs lead; the interface recedes.

## Audience / job / action

Community peers (PixiJS / WebGL / creative-coding) arriving from shared links. Job: see what the closed @pixi/3d beta can do and jump into a lab. Primary action: open a lab (`/labs/hello-cube/`, `/labs/2d3d-hybrid/`); secondary: share / read source on GitHub. Proof is the labs themselves — no claims, no fabricated results.

## Constraints

World pinned by the user: Omarchy/TUI-inspired — near-black warm ground (#0b0908), red dominant (#e5483c), JetBrains Mono as the only face. User steer on expression: **web-first, TUI as material not costume**; no ASCII/box-drawing art in load-bearing spots (it rendered broken for the user). Identity minimal: discreet `github ↗` only. Copy in English. Beta honesty: status always visible.

## Chosen direction

**Editorial Mono Index — bolder** (user-locked after a 3-hand tournament). Typography at poster scale is the whole interface: two ~88-96px index rows (`01 hello-cube`, `02 2d3d-hybrid`), numerals set in solid red squares, full-bleed inverse-video hover (red bar, near-black text), ghost outline "3D" watermark that flips to a negative (ink stroke on the red band, mix-blend difference) wherever the bands cross it, pinned status line. Memorable moment: the full-bleed red inversion on hover. `↑/↓` cycles the standing inversion across rows infinitely (focus follows; Enter opens natively).

## Direction contract

THESIS: the index IS the interface — two lines of poster-scale mono type, refusing the card-grid and terminal-replica defaults of a lab portfolio.
OWN-WORLD: near-black warm ground; red owns the accent layer (numeral squares, inverse bars, links); cream display mono at poster sizes; dim warm gray for secondary; hairline #2a1f1a rules; square corners.
STORY: the visitor understands "two hands-on labs into the closed PixiJS 3D beta", believes the source is open and the thing is live, and opens a lab.
FIRST VIEWPORT: top bar (wordmark only — one github link total, in the status line); one intro line (15px dim, max 62ch); the two index rows — 84px red numeral squares + 88px names + suffix metadata; row 02 rendered in its inverted hover state with the page's single blinking cursor; ghost outline "3D" upper-right; status line pinned at the bottom edge.
FORM: Editorial Mono Index, dealt candidate 4 of the second hand (seed: 9a082991428ac9c9).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved

- Deployment target (Vercel / Netlify / GitHub Pages) — does not bind this surface's design.
- Real lab pages don't exist yet (tickets 04/05); landing links point at future routes.
