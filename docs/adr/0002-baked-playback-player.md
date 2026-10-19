# Baked playback: the reusable player samples a recorded Timeline

Lab 02 (ticket 09) needed loop, pause, scrub and a progress bar over a physics
choreography, and the player had to be reusable across labs. We decided on **baked
playback**: at init the full choreography is simulated headless in Rapier at a fixed
60 Hz and recorded as per-tick poses (`src/labs/core/playback/timeline.ts` since ADR
0004); a pure controller (`src/labs/core/playback/player.ts`) samples that Timeline and
drives the UI. The controller has no
clock of its own — the lab advances it from the shell's ticker — and knows nothing of
physics or rendering behind the `TimelineSource` seam.

## Considered options

- **Live simulation** (step the world in the ticker): pause is trivial, but scrub and
  deterministic loops are not, the player couples to the physics engine, and device
  timing changes the take. Rejected.
- **Shell-owned player auto-installed for every lab**: less explicit than a lab
  instantiating its own player over a slot the layout reserves. Rejected (ticket 09 Q9).

## Consequences

- Playback is 100% deterministic across devices: the recording is data. Loop, pause,
  scrub and the `?t=<ms>` debug/capture affordance are all trivial sampling operations.
- Reduced motion and `?static` freeze at pose zero for free (sample tick 0).
- The bake costs a sub-second main-thread simulation at load (cached per session) and a
  pose buffer (~1 MB for 90 bodies); Rapier's compat build inlines the WASM, so the
  lab's chunk carries ~4.2 MB — page-scoped and lazy. Streaming the raw WASM
  (`@dimforge/rapier3d` + bundler wiring) is the lever if that ever hurts.
- The bake must **pre-settle the stack, disable solver sleep** (`setCanSleep(false)` —
  a body frozen mid-air by sleep would record a lie) and **damp the sphere**; otherwise
  the impact solves as a slide and the rest condition never fires (bake-tuned, ticket 09).
- Player events (`frame`/`loop`/`phaseChange`) are subscription sets returning an
  unsubscriber — a single slot would let the UI's renderer mute the lab's pose applier
  (and did, once).
