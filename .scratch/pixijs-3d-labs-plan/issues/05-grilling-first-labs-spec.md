# First two labs: spec

Status: resolved
Type: grilling
Blocked by: 06

## Question

What is the concrete spec for the first two labs — "hello cube" and a 2D+3D hybrid?

For each: what it shows, what 3D content, what 2D overlay. Depends on the beta API (ticket 01).

## Answer

Decided in a grilling session (2026-10-19; 13 questions in two rounds, all recommendations accepted, user-confirmed). The spec pins shape and constraints; exact values are starting points, tuned at implementation.

### Lab 01 — `hello-cube` (route `/labs/hello-cube/`)

- **What it shows**: the minimal proof — the beta's smallest honest scene (`View3D` → lights → mesh → camera) running on the shell, with the resolved backend reported in the status line. Explicitly not a feature tour: no post-processing, no particles, no extra geometry.
- **3D content**: the prototype scene as spec of record — rounded box (size 1, radius 0.1), `Material3D` base `#e5483c` metallic 0.05 / roughness 0.35, warm ambient + warm key light + red rim light, fixed camera at (2.2, 1.8, 3.2) looking at origin, slow Y-rotation (0.5 rad/s starting value).
- **2D overlay**: none beyond page chrome (standing band + status line, owned by the Lab Layout).
- **Interaction**: none — auto-rotation only; `OrbitCamera` is lab 02's.
- **Color rule**: Signal Red may enter the scene as the subject's privilege (the cube and its rim); the environment stays ink (per the shell defaults). DESIGN.md's Signal Rule governs UI chrome, not scene content.

### Lab 02 — `views-in-2d` (route `/labs/views-in-2d/`)

- **What it shows**: the product's positioning claim — several 3D views composing inside one 2D stage, the integration generic 3D engines cannot show (homage to the beta's `views-in-2d` example).
- **3D content**: three inset `View3D`s in a centered, even row, one material model each: (1) `01 · METAL` — metallic PBR torus knot; (2) `02 · GLASS` — transmissive glass capsule; (3) `03 · TOON` — toon sphere in Signal Red (the only red object in the scene). Metal and glass stay material-honest.
- **2D overlay**: plain mono captions beneath each plate (`01 · METAL`, `02 · GLASS`, `03 · TOON`, English), warm gray with the numeral in red; no boxes, no cards, no panels. No other 2D decoration.
- **Interaction**: per-view orbit — each specimen idles in a slow self-rotation; dragging on a plate orbits that view's camera (`OrbitCamera`); dragging elsewhere does nothing.
- **Post-processing**: none in v1.
- **Implementation note (not spec)**: the glass refracts its view's own ink environment; making the transmission pop against it is a tuning concern, not a spec constraint.

### Cross-lab decisions

- **Motion policy (both labs)**: under reduced motion the scene renders but does not animate — a static frame at pose zero. That same pose-zero frame is the `?static` capture frame, keeping preview screenshots deterministic.
- **Spec precision**: shape and constraints are decided here; the recorded values (rotation speeds, intensities, camera positions) are starting values — implementation owns the decimals without revisiting this ticket.
- **Lab numbering**: hello-cube is lab 01 (already so in the prototype); views-in-2d is lab 02.
