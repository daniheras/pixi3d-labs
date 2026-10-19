// World defaults for every lab View3D (ticket 04 / ADR 0001): ink environment and
// app-resize, so labs get the house look for free and override only what differs.
import type { Application } from 'pixi.js';
import { View3D, type View3DOptions } from '@pixi/3d';

export const WORLD_DEFAULTS: Partial<View3DOptions> = {
	autoResize: true,
	environment: {
		skyColor: 0x2a1f1a,
		groundColor: 0x0b0908,
	},
};

/**
 * Create a View3D with the world defaults and add it to the app's stage. Labs override
 * per-view sizing or environment via `overrides` — one call or N.
 */
export function createView3D(app: Application, overrides: Partial<View3DOptions> = {}): View3D {
	const view = new View3D({ ...WORLD_DEFAULTS, ...overrides });
	app.stage.addChild(view);
	return view;
}
