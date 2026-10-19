// Renderer shell (ticket 04 / ADR 0001): one entry, `mountLab(host, scene)`, owns the whole
// lab lifecycle — Application init/destroy, canvas mounting, app-level resize, the
// astro:page-load / astro:before-swap re-entry lifecycle (the once-per-session semantics
// behind ticket 08's bug), awaiting async setup, failure routing, backend truth and
// ?static capture. Labs describe themselves as scene objects and build their own View3D(s)
// via `createView3D`; camera and reduced-motion policy are lab-side.
import { Application, RendererType, type Ticker } from 'pixi.js';
import { View3D, type View3DOptions } from '@pixi/3d';

export type LabBackend = 'webgpu' | 'webgl';

export interface LabContext {
	/** Initialized pixi Application. */
	app: Application;
	/** Element the canvas mounts into (the layout's scene host). */
	host: HTMLElement;
	/** Actually resolved graphics backend. */
	backend: LabBackend;
	/** Visitor prefers reduced motion — labs decide what degrades. */
	reducedMotion: boolean;
	/** Capture mode (?static): exactly one fixed-delta frame will render; avoid randomness. */
	static: boolean;
}

export interface LabScene {
	/**
	 * Build the scene. May be async. Must be idempotent across calls: ClientRouter runs page
	 * scripts once per session, so the shell re-runs setup on every arrival and dispose on
	 * every departure with the same scene object.
	 */
	setup(ctx: LabContext): void | Promise<void>;
	/** Per-frame hook, registered on app.ticker only after setup resolves. */
	update?(ticker: Ticker): void;
	/** Lab-side cleanup, before app.destroy. */
	dispose?(): void;
}

/** Fixed delta for the one update ?static renders (one 60 Hz frame). */
const STATIC_DELTA_MS = 1000 / 60;

interface MountState {
	app: Application | null;
	/** One scene per page path: with ClientRouter, every page's module lives for the session. */
	scenes: Map<string, LabScene>;
	/** Set while init is in flight, so a duplicate page-load can't double-init. */
	initializing: false | Promise<void>;
}

const state: MountState = { app: null, scenes: new Map(), initializing: false };
let listenersBound = false;

/**
 * Mount a lab scene into the layout's scene host. Call once at module scope of a lab page;
 * the shell re-runs setup itself on every astro:page-load and tears down on astro:before-swap.
 * The host is only read for the immediate init — later arrivals re-resolve the layout's
 * `[data-lab-stage]` element, since view transitions replace the DOM.
 */
export function mountLab(host: HTMLElement, scene: LabScene): void {
	// the module body runs on the page it belongs to, so the path keys the scene
	state.scenes.set(location.pathname, scene);
	bindLifecycle();

	// first arrival: the module body runs after the DOM is parsed, so host is live
	void init(host, scene);
}

function bindLifecycle(): void {
	if (listenersBound) return;
	listenersBound = true;

	document.addEventListener('astro:page-load', () => {
		const scene = state.scenes.get(location.pathname);
		if (scene) void init(currentStage(), scene);
	});

	document.addEventListener(
		'astro:before-swap',
		() => {
			teardown();
		},
		{ once: false },
	);
}

/** The layout's scene host, current for this arrival. */
function currentStage(): HTMLElement | null {
	return document.querySelector<HTMLElement>('[data-lab-stage]');
}

async function init(host: HTMLElement | null, scene: LabScene): Promise<void> {
	// re-entry dedupe (ticket 08's bug): the stage may already hold a canvas, or init may
	// be mid-flight from a duplicate event
	if (!host || host.querySelector('canvas') || state.initializing) return;

	const app = new Application();
	state.app = app;
	const run = (async () => {
		try {
			await app.init({
				preference: 'webgpu',
				backgroundAlpha: 0,
				antialias: true,
				resizeTo: host, // app-level resize is shell-owned
			});
			if (state.app !== app) return; // torn down mid-flight (fast swap)
			host.appendChild(app.canvas);

			const backend: LabBackend = app.renderer.type === RendererType.WEBGPU ? 'webgpu' : 'webgl';
			reportBackend(backend);

			const ctx: LabContext = {
				app,
				host,
				backend,
				reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
				static: new URLSearchParams(location.search).has('static'),
			};

			// updates start only after setup resolves
			await scene.setup(ctx);
			if (state.app !== app) return;

			if (ctx.static) {
				// ?static: exactly one fixed-delta update, ticker stopped, one render —
				// commit-once captures are reproducible with zero capture-specific lab code
				app.stop();
				scene.update?.(staticTicker(app));
				app.render();
			} else if (scene.update) {
				app.ticker.add(scene.update);
			}
		} catch (err) {
			if (state.app === app) {
				teardown();
				renderFailure(host, err);
			}
		} finally {
			// only clear if no newer init has already replaced the flag
			if (state.initializing === run) state.initializing = false;
		}
	})();
	state.initializing = run;

	await run;
}

/** A Ticker stand-in carrying the fixed delta ?static advances by. */
function staticTicker(app: Application): Ticker {
	return { deltaMS: STATIC_DELTA_MS, deltaTime: STATIC_DELTA_MS / (1000 / 60), app } as unknown as Ticker;
}

/** Write the resolved backend into any `[data-lab-backend]` element — the status line reports truth. */
function reportBackend(backend: LabBackend): void {
	for (const el of document.querySelectorAll('[data-lab-backend]')) {
		el.textContent = `backend: ${backend}`;
	}
}

/** Styled inline failure line in the scene host; the lab stays readable without a renderer. */
function renderFailure(host: HTMLElement, err: unknown): void {
	const message = err instanceof Error ? err.message : String(err);
	host
		.querySelectorAll(':scope > canvas, :scope > [data-lab-failure]')
		.forEach((el) => el.remove());

	const line = document.createElement('div');
	line.dataset.labFailure = '';
	line.textContent = `render: failed — ${message}`;
	host.appendChild(line);
}

function teardown(): void {
	const { app, scene } = state;
	if (!app) return;
	state.app = null;
	if (scene?.update) app.ticker.remove(scene.update);
	scene?.dispose?.();
	app.destroy(true, { children: true, texture: true, textureSource: true });
}

const WORLD_DEFAULTS: Partial<View3DOptions> = {
	autoResize: true,
	environment: { skyColor: 0x2a1f1a, groundColor: 0x0b0908 },
};

/**
 * Create a View3D with the world defaults (ink environment, autoResize) and add it to the
 * app's stage. Labs override per-view sizing or environment via `overrides` — one call or N.
 */
export function createView3D(app: Application, overrides: Partial<View3DOptions> = {}): View3D {
	const view = new View3D({ ...WORLD_DEFAULTS, ...overrides });
	app.stage.addChild(view);
	return view;
}
