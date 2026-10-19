# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Community peers — web graphics developers (PixiJS, WebGL/WebGPU, creative-coding scenes) who follow PixiJS's 3D beta and arrive via shared links or community channels. They land on desktop, are technically fluent, and want to see the technology working, not read marketing.

## Product Purpose

A portfolio-style set of small, self-contained labs demonstrating the closed PixiJS 3D beta (`@pixi/3d` 0.1.0-beta.2): standalone 3D demos and 2D+3D hybrids, each on its own route (`/labs/<slug>/`) with a static screenshot preview. The landing page indexes the labs and routes visitors into them. Success: a peer enters a lab, plays with the demo, and shares the link or digs into the code.

## Positioning

An early, hands-on look at the PixiJS 3D closed beta through focused, minimal, well-crafted labs — including the tight 2D+3D integration (`View3D` rendering a 3D scene inside a 2D container) that generic 3D-engine demos cannot show.

## Operating Context

- Closed, invite-only beta; installed from a release tarball, not npm.
- WebGPU-first with WebGL fallback (beta's own architecture).
- One static preview image per lab, committed as an asset and regenerated only when a lab changes.
- Labs are read and shared as individual links; the landing is the entry point.
- All site copy in English.

## Capabilities and Constraints

- Stack: Astro + vanilla TypeScript, no UI framework; a shared lab shell handles renderer init, camera, resize, cleanup (API being settled separately).
- First two labs already decided: "hello cube" and a 2D+3D hybrid.
- Beta status must be visible and honest; nothing may imply a stable public API.
- Explicitly undecided: deployment target (Vercel/Netlify/GitHub Pages), styling/CSS approach, bundle/perf strategy, labs beyond the first two.

## Brand Commitments

- Name: `pixijs-3d-labs`.
- Pinned landing aesthetic (binding, set by the user): Omarchy / TUI style, "less is more" minimal, red as the dominant color.
- Identity is minimal on purpose: a discreet GitHub link only — no personal name or handle on the page.

## Evidence on Hand

- Confirmed beta access; the API surface (install, `View3D`, hello-cube pattern, 2D↔3D composition) is captured in `.scratch/pixijs-3d-labs-plan/issues/06-task-share-beta-access.md`.
- Research on static preview capture: `.scratch/pixijs-3d-labs-plan/issues/02-research-static-previews.md`.
- No real lab screenshots exist yet — lab previews are placeholders until the labs are built. Future work must not fabricate demo results or benchmarks.

## Product Principles

1. **The lab is the proof.** Every claim is a running demo; the landing routes to artifacts, never to promises.
2. **Less is more.** Sparse, focused, deliberate; every element earns its place.
3. **Honest beta.** Beta status and limitations are stated, never dressed up.
4. **Shareable units.** Each lab is self-contained, linkable, and inspectable on its own.
