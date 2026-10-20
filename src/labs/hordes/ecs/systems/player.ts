// Player systems (ticket 02): keyboard state → velocity, singleton timers, and the
// fire director (cadence, boost multiplier, nearest-enemy threshold from the grid).
// Pure functions over the bundle — everything they need comes in or goes into the
// bundle's ECS tables and director state.
import { addComponent, addEntity, hasComponent } from 'bitecs';
import {
	Bullet,
	Dying,
	Enemy,
	Lifetime,
	Player,
	Slot,
	Transform,
	Velocity,
} from '../components';
import { HORDES } from '../../config';
import type { HordeBundle } from '../world';

/** The four movement keys, already reduced from raw keyboard events by the scene. */
export interface KeyState {
	forward: boolean;
	back: boolean;
	left: boolean;
	right: boolean;
}

/** Analog movement axis, normalized to magnitude ≤ 1, screen sense (y-down). */
export interface MoveAxis {
	x: number;
	y: number;
}

/** Screen-sense axis from the keys: right = +x world, forward = −y world (camera truth). */
export function keyboardAxis(keys: KeyState): MoveAxis {
	let x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
	let y = (keys.back ? 1 : 0) - (keys.forward ? 1 : 0);
	if (x !== 0 && y !== 0) {
		x *= Math.SQRT1_2;
		y *= Math.SQRT1_2;
	}
	return { x, y };
}

/**
 * Set the player's velocity from the (already merged) move axis; diagonals keep their
 * length — the keyboard normalizes itself and the joystick is analog by design, so a
 * half-tilt walks slower exactly like a thumb implies.
 */
export function playerInput(bundle: HordeBundle, move: MoveAxis): void {
	const eid = bundle.playerEid;
	Velocity.x[eid] = move.x * HORDES.player.speed;
	Velocity.y[eid] = move.y * HORDES.player.speed;
}

/** Advance the player's singleton timers: boost, hurt flash, invulnerability. */
export function playerTimers(bundle: HordeBundle, dt: number): void {
	const eid = bundle.playerEid;
	if (Player.boostTimer[eid] > 0) {
		Player.boostTimer[eid] = Math.max(0, Player.boostTimer[eid] - dt);
	}
	if (Player.invulnTimer[eid] > 0) {
		Player.invulnTimer[eid] = Math.max(0, Player.invulnTimer[eid] - dt);
	}
	if (Player.hurtTimer[eid] > 0) {
		Player.hurtTimer[eid] = Math.max(0, Player.hurtTimer[eid] - dt);
	}
}

/**
 * Fire director: fires only when the nearest live enemy sits inside `fireThreshold`
 * (spec: no shot past the threshold); direction locks at the shot (no homing), and one
 * kill spends the bullet. While a boost is active each shot is a radial volley of 8
 * bullets every 45°, the first aimed at the nearest enemy; otherwise it is one bullet.
 */
export function fireDirector(bundle: HordeBundle, dt: number): void {
	const eid = bundle.playerEid;
	const boosted = Player.boostTimer[eid] > 0;

	const timer = Player.fireTimer[eid] - dt;
	if (timer > 0) {
		Player.fireTimer[eid] = timer;
		return;
	}
	// keep cadence under frame overshoot instead of dropping the remainder
	Player.fireTimer[eid] = timer + HORDES.player.fireInterval;

	const px = Transform.x[eid];
	const py = Transform.y[eid];
	const threshold = HORDES.player.fireThreshold;

	let nearestEid = -1;
	let nearestDistSq = threshold * threshold; // the threshold is itself the search bound
	bundle.grid.box(
		px - threshold,
		py - threshold,
		px + threshold,
		py + threshold,
		(cellEids) => {
			for (const target of cellEids) {
				if (!hasComponent(bundle.ecs, target, Enemy)) continue; // the grid holds everything
				if (hasComponent(bundle.ecs, target, Dying)) continue; // the dying don't aim shots
				const dx = Transform.x[target] - px;
				const dy = Transform.y[target] - py;
				const distSq = dx * dx + dy * dy;
				if (distSq < nearestDistSq) {
					nearestDistSq = distSq;
					nearestEid = target;
				}
			}
		},
	);
	if (nearestEid === -1) return; // spec: outside the threshold, no shot

	let vx = 0;
	let vy = 0;
	if (nearestEid === bundle.playerEid) return; // paranoid: the player is never a grid target
	if (nearestDistSq > 1e-8) {
		const dist = Math.sqrt(nearestDistSq);
		vx = (Transform.x[nearestEid] - px) / dist;
		vy = (Transform.y[nearestEid] - py) / dist;
	} else {
		vx = 1; // degenerate: the enemy sits on the barrel; any right-facing shot works
	}
	if (!boosted) {
		spawnBullet(bundle, px, py, vx, vy);
		return;
	}

	// boost: a radial volley, spoke 0 at the aimed enemy, evenly spaced
	const baseAngle = Math.atan2(vy, vx);
	const step = (Math.PI * 2) / HORDES.boost.spokes;
	for (let spoke = 0; spoke < HORDES.boost.spokes; spoke++) {
		const angle = baseAngle + spoke * step;
		spawnBullet(bundle, px, py, Math.cos(angle), Math.sin(angle));
	}
}

/** One bullet from the player at (x, y), locked at the (unit) direction given. */
function spawnBullet(bundle: HordeBundle, x: number, y: number, dirX: number, dirY: number): void {
	const slot = bundle.bulletPool.acquire();
	if (slot === -1) return; // bullet cap reached: this spoke is skipped, honest budget

	const bulletEid = addEntity(bundle.ecs);
	addComponent(bundle.ecs, bulletEid, Bullet);
	addComponent(bundle.ecs, bulletEid, Transform);
	addComponent(bundle.ecs, bulletEid, Velocity);
	addComponent(bundle.ecs, bulletEid, Lifetime);
	addComponent(bundle.ecs, bulletEid, Slot);
	Transform.x[bulletEid] = x;
	Transform.y[bulletEid] = y;
	Velocity.x[bulletEid] = dirX * HORDES.bullet.speed;
	Velocity.y[bulletEid] = dirY * HORDES.bullet.speed;
	Lifetime.t[bulletEid] = HORDES.bullet.lifetime;
	Slot.i[bulletEid] = slot;
}
