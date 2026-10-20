// Lab 05 — hordes (ticket 03): the view-side assembly of the bitecs survival game.
// All gameplay constants live in ./config and the ECS world in ./ecs/world; this file
// only assembles the scene graph (view, lights, arena dressing, camera), runs the step
// pipeline on the ticker, owns the game-over banner + the internal restart, and
// degrades FX under reduced motion.
import { Material3D, type View3D } from '@pixi/3d';
import { addLightRig } from '../core/theme';
import { createView3D } from '../core/world';
import type { LabContext, LabScene } from '../core/shell';
import { HORDES } from './config';
import { createHud, type Hud } from './ecs/hud';
import { renderSync, stepStatic, stepWorld, type KeyState } from './ecs/systems/step';
import { createHordeBundle, destroyHordeBundle, type HordeBundle } from './ecs/world';

/** Seed for the ?static capture frame: a constant, so captures replay identically. */
const STATIC_SEED = 20260412;

/** The key map shared by keydown and keyup, beacon-def: one truth table, no drift. */
const KEY_MAP: Record<string, keyof KeyState> = {
	KeyW: 'forward',
	ArrowUp: 'forward',
	KeyS: 'back',
	ArrowDown: 'back',
	KeyA: 'left',
	ArrowLeft: 'left',
	KeyD: 'right',
	ArrowRight: 'right',
};

export function createHordesScene(): LabScene {
	let ctx: LabContext | null = null;
	let view: View3D | null = null;
	let bundle: HordeBundle | null = null;
	let hud: Hud | null = null;
	const keys: KeyState = { forward: false, back: false, left: false, right: false };
	/** Held listeners, for idempotent setup re-entry (the shell may re-run setup). */
	let down: ((e: KeyboardEvent) => void) | null = null;
	let up: ((e: KeyboardEvent) => void) | null = null;
	/** Remaining game-over banner seconds; null means the banner isn't up. */
	let bannerTimer: number | null = null;

	/** Drops every key listener; safe to call half-attached. */
	function detachKeys(): void {
		if (down) window.removeEventListener('keydown', down);
		if (up) window.removeEventListener('keyup', up);
		window.removeEventListener('blur', onBlur);
		down = null;
		up = null;
	}

	/** Window blur must not leak held keys into a wild walk on the way back. */
	function onBlur(): void {
		keys.forward = false;
		keys.back = false;
		keys.left = false;
		keys.right = false;
	}

	/** One clean game: tear down any previous world, rebuild pools and tables from zero. */
	function startNewGame(): void {
		if (!view) return;
		if (bundle) destroyHordeBundle(bundle);
		bundle = createHordeBundle(view, ctx?.static ? STATIC_SEED : undefined);
	}

	return {
		setup(context) {
			ctx = context;

			view = createView3D(context.app);
			view.camera.mode = HORDES.camera.mode;
			view.camera.orthographicSize = HORDES.camera.orthographicSize;
			addLightRig(view.root, HORDES.lights);

			view.camera.position.set(...HORDES.camera.position);
			view.camera.lookAt({
				x: HORDES.camera.target[0],
				y: HORDES.camera.target[1],
				z: HORDES.camera.target[2],
			});

			hud = createHud(context);
			if (context.static) hud.elem.hidden = true; // the capture shows the game, not the HUD

			// idempotent attach: any prior listener pair comes off before the new one
			detachKeys();
			down = (e) => {
				const dir = KEY_MAP[e.code];
				if (dir) keys[dir] = true;
			};
			up = (e) => {
				const dir = KEY_MAP[e.code];
				if (dir) keys[dir] = false;
			};
			window.addEventListener('keydown', down);
			window.addEventListener('keyup', up);
			window.addEventListener('blur', onBlur);

			startNewGame();
		},

		update(ticker) {
			if (!ctx || !bundle || !hud) return;

			// ?static: the shell runs exactly one fixed-delta frame — seed it, mirror it
			if (ctx.static) {
				stepStatic(bundle);
				return;
			}

			const dt = Math.min(ticker.deltaMS / 1000, 0.05); // tab-away spikes stay bounded

			if (bannerTimer !== null) {
				// death frozen, banner up; the restart is the lab's own business
				bannerTimer -= dt;
				if (bannerTimer <= 0) {
					bannerTimer = null;
					hud.banner(null);
					startNewGame();
				}
				return;
			}

			stepWorld(bundle, keys, dt);
			renderSync(bundle, ctx.reducedMotion);

			if (bundle.director.gameOver) {
				bannerTimer = 1; // the spec's one GAME OVER second, scene-owned
				hud.banner('game over');
			} else {
				hud.refresh(bundle);
			}
		},

		dispose() {
			detachKeys();
			if (hud) {
				hud.dispose();
				hud = null;
			}
			if (bundle) {
				destroyHordeBundle(bundle);
				bundle = null;
			}
			view = null;
			ctx = null;
		},
	};
}


