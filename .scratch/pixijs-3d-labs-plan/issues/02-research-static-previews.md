# Static preview screenshots for WebGL labs

Status: resolved
Type: research

## Question

How should the plan generate a static screenshot preview for each WebGL / PixiJS lab?

Investigate:

- PixiJS `renderer.extract` / `canvas.toBlob`.
- Headless capture (Playwright / Puppeteer) and whether it supports WebGL / WebGPU.
- Manual capture.

Recommend an approach that fits "one static image per lab, committed as an asset".

## Answer

**Recommendation: capture once via a committed Playwright/Puppeteer script, commit the PNG as an asset; do NOT regenerate on every build.**

- PixiJS v8 `renderer.extract.*` (`canvas`, `base64`, `image`, `download`) captures the canvas/scene only and needs something outside the page (a headless driver or a human) to write the PNG to disk.
- WebGL renders headless via SwiftShader (software, no GPU needed); WebGPU is blocklisted headless unless `--enable-unsafe-webgpu` (+ software-Vulkan flags on Linux).
- Plan: a dev-only `?capture` mode per lab (render one deterministic frame at fixed resolution), then `page.screenshot({ clip })` or `locator('canvas').screenshot()` to write the PNG.
- Commit PNG under `public/previews/<lab>.png`; re-run only when a lab changes.

Trade-off: software-rendered output may differ subtly from hardware; acceptable for a static preview. Build-time auto-generation is possible but adds a browser dependency and non-deterministic diffs.

Sources: https://pixijs.download/release/docs/rendering.ExtractSystem.html · https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md · https://developer.chrome.com/blog/supercharge-web-ai-testing · https://playwright.dev/docs/screenshots
