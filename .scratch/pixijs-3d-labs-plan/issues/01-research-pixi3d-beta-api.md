# PixiJS 3D beta: delivery and API surface

Status: resolved
Type: research

## Question

How is the PixiJS 3D beta delivered and what is its API surface?

Specifically:

- Package / repo name and install method (npm package? git dependency?).
- How to create an Application / renderer and add a 3D mesh, a light, and a camera.
- How materials and lighting work; how a ticker / render loop runs.
- How 2D content overlays or blends with 3D (the 2D+3D hybrid case).

Note: the beta is a closed invite. If public sources don't cover the beta, report what is public and flag exactly what needs the user to share access.

## Answer

**Delivery:** closed, invite-only beta delivered as a **private GitHub repo invite** (the sign-up form at pixijs.com/3d asks for your GitHub username "to send your beta repo invite"). No public npm package, no public git dependency, no public repo, no public API docs. It will be open-sourced after the closed period.

**Public facts (architecture / intent, from official sources):**

- WebGPU-first with WebGL fallback.
- 3D shares the 2D automatic batching pipeline: materials, lighting, and shadows all batched; 200k objects + shadows + dynamic lighting demoed.
- Opinionated — "fast scalable 3D that integrates tightly with 2D", not a general-purpose engine.
- Origin: open-sourcing of the internal "Odie" engine (Playco/Goodboy).
- Public `pixi.js` already ships early 3D building blocks: `CubeTexture`, external textures, mip-level rendering, render-to-array-layer.

**Code-level API (mesh / light / camera / materials / ticker / 2D↔3D composition): NOT public.** Requires the user's beta access → graduated ticket 06 (task) to share access and capture the API surface.

Sources: https://pixijs.com/3d · https://x.com/PixiJS/status/2099920340814319859 · https://pixijs.com/blog/8.16.0 · https://pixijs.com/blog/pixi-universe
