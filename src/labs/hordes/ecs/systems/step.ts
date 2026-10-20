// Step pipeline (ticket 02): the fixed system order for one tick. Layout matters:
// spawns and timers write state, seek/movement read state, the grid rebuild snapshots
// positions, then all spatial queries (fire, collisions) see the same frame truth.
// The scene calls stepWorld once per ticker update; gameOver freezes it — the scene
// owns the banner and the restart, the simulation says exactly nothing after death.
import { query } from 'bitecs';
import { Bullet, Enemy, Player } from '../components';
import type { HordeBundle } from '../world';
import { rebuildGrid } from './spatial-hash';
import { playerInput, playerTimers, fireDirector, type KeyState } from './player';
import { seekEnemies, moveEntities } from './enemies';
import { spawnDirector, pickupRoll, seedStaticFrame } from './spawn';
import {
	collideBullets,
	collidePlayer,
	collidePickups,
	dyingClock,
	expireBullets,
} from './damage';
import { renderSync } from './render';

/** Re-exported so scenes need exactly one import from ./ecs/systems. */
export { renderSync } from './render';

export type { KeyState } from './player';

/** Advance the whole simulation one tick, in the pipeline order above. */
export function stepWorld(bundle: HordeBundle, keys: KeyState, dt: number): void {
	const d = bundle.director;
	if (d.gameOver) return; // frozen between death and the scene's restart

	d.elapsed += dt;

	spawnDirector(bundle, dt);
	pickupRoll(bundle, dt);
	playerTimers(bundle, dt);
	playerInput(bundle, keys);
	seekEnemies(bundle, dt);
	moveEntities(bundle, dt);
	rebuildGrid(bundle);
	fireDirector(bundle, dt);
	collideBullets(bundle, dt);
	collidePlayer(bundle);
	collidePickups(bundle);
	dyingClock(bundle, dt);
	expireBullets(bundle, dt);
}

/**
 * ?static path: seed the deterministic mid-horde frame (no step runs — the shell will
 * render exactly this one fixed-delta frame), then mirror it into the meshes.
 */
export function stepStatic(bundle: HordeBundle): void {
	seedStaticFrame(bundle);
	renderSync(bundle, false);
}

/** Live counts for the HUD — refreshed on the HUD's own 4 Hz clock. */
export function countsForHud(bundle: HordeBundle): {
	enemies: number;
	bullets: number;
	lives: number;
	kills: number;
} {
	const { ecs } = bundle;
	return {
		enemies: query(ecs, [Enemy]).length,
		bullets: query(ecs, [Bullet]).length,
		lives: Math.max(0, Player.lives[bundle.playerEid]),
		kills: bundle.director.kills,
	};
}
