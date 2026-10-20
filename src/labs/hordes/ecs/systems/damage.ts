// Damage & collision stage (ticket 02): the three spatial-hash queries the spec names
// (bullet→enemy, enemy→player, pickup→player — the last one brute-forced over at most
// two pickups), the dying FX clock, and bullet expiry. Squared distances only.
//
// Removals go through bitecs's deferred flush — no entity removal while iterating the
// same query past this point; every hit marks state and releases the pool slot, the
// next query call commits the shape change.
import { addComponent, hasComponent, query, removeEntity } from 'bitecs';
import {
	Bullet,
	Dying,
	Enemy,
	Lifetime,
	Pickup,
	Player,
	Slot,
	Transform,
	Velocity,
} from '../components';
import { HORDES } from '../../config';
import type { HordeBundle } from '../world';

/** Squared distance from a point to a segment — the swept-bullet overlap test. */
function pointSegmentDistSq(
	bx0: number,
	by0: number,
	bx1: number,
	by1: number,
	cx: number,
	cy: number,
): number {
	const dx = bx1 - bx0;
	const dy = by1 - by0;
	const lenSq = dx * dx + dy * dy;
	if (lenSq < 1e-12) {
		// degenerate segment: pure point distance
		const ex = cx - bx0;
		const ey = cy - by0;
		return ex * ex + ey * ey;
	}
	let t = ((cx - bx0) * dx + (cy - by0) * dy) / lenSq;
	t = Math.max(0, Math.min(1, t));
	const ex = cx - (bx0 + t * dx);
	const ey = cy - (by0 + t * dy);
	return ex * ex + ey * ey;
}

/** Send an enemy into its dying FX window: frozen, flashed, then recycled by dyingClock. */
export function enterDying(bundle: HordeBundle, eid: number): void {
	addComponent(bundle.ecs, eid, Dying);
	Dying.t[eid] = HORDES.death.dying;
	Velocity.x[eid] = 0;
	Velocity.y[eid] = 0;
	bundle.director.kills++;
}

/**
 * Bullet→enemy overlap: every bullet sweeps its last-tick segment against the grid
 * (axis range of prev/cur endpoints widened by the sum of hit radii), the first enemy
 * inside radius dies, the bullet spent. One bullet, one kill per spec.
 */
export function collideBullets(bundle: HordeBundle, dt: number): void {
	const { ecs, grid } = bundle;
	const hitSum = HORDES.collision.enemyRadius + HORDES.collision.bulletRadius;
	const hitSumSq = hitSum * hitSum;

	for (const eid of query(ecs, [Bullet])) {
		const x0 = Transform.x[eid];
		const y0 = Transform.y[eid];
		const x1 = x0 + Velocity.x[eid] * dt;
		const y1 = y0 + Velocity.y[eid] * dt;

		let victim = -1;
		grid.box(
			Math.min(x0, x1) - hitSum,
			Math.min(y0, y1) - hitSum,
			Math.max(x0, x1) + hitSum,
			Math.max(y0, y1) + hitSum,
			(cellEids) => {
				if (victim !== -1) return; // first kill spends the bullet
				for (const target of cellEids) {
					if (!hasComponent(ecs, target, Enemy)) continue;
					if (hasComponent(ecs, target, Dying)) continue; // already dying, skip
					const cx = Transform.x[target];
					const cy = Transform.y[target];
					if (pointSegmentDistSq(x0, y0, x1, y1, cx, cy) < hitSumSq) {
						victim = target;
						break;
					}
				}
			},
		);

		if (victim !== -1) {
			enterDying(bundle, victim);
			bundle.bulletPool.release(Slot.i[eid]);
			removeEntity(ecs, eid);
		}
	}
}

/**
 * Enemy→player overlap: any live (non-dying) enemy inside the player's body radius
 * costs one life — unless the invulnerability window is still running. The last life
 * flips the bundle's gameOver flag; the scene owns everything past that (banner,
 * freeze, restart).
 */
export function collidePlayer(bundle: HordeBundle): void {
	const { ecs, grid } = bundle;
	const eid = bundle.playerEid;
	if (bundle.director.gameOver) return;
	if (Player.invulnTimer[eid] > 0) return;

	const px = Transform.x[eid];
	const py = Transform.y[eid];
	const r = HORDES.collision.playerRadius + HORDES.collision.enemyRadius;
	const rSq = r * r;
	let hit = false;

	grid.box(px - r, py - r, px + r, py + r, (cellEids) => {
		if (hit) return;
		for (const target of cellEids) {
			if (!hasComponent(ecs, target, Enemy)) continue;
			if (hasComponent(ecs, target, Dying)) continue;
			const dx = Transform.x[target] - px;
			const dy = Transform.y[target] - py;
			if (dx * dx + dy * dy < rSq) {
				hit = true;
				break;
			}
		}
	});
	if (!hit) return;

	Player.lives[eid]--;
	Player.invulnTimer[eid] = HORDES.player.invuln;
	Player.hurtTimer[eid] = HORDES.death.dying;
	if (Player.lives[eid] <= 0) {
		Player.lives[eid] = 0;
		bundle.director.gameOver = true;
	}
}

/** Pickup→player grab: fire rate × boost multiplier for the boost duration, then gone. */
export function collidePickups(bundle: HordeBundle): void {
	const { ecs } = bundle;
	const eid = bundle.playerEid;
	const px = Transform.x[eid];
	const py = Transform.y[eid];
	const r = HORDES.collision.playerRadius + HORDES.collision.pickupRadius;
	const rSq = r * r;

	for (const pickup of query(ecs, [Pickup])) {
		const dx = Transform.x[pickup] - px;
		const dy = Transform.y[pickup] - py;
		if (dx * dx + dy * dy < rSq) {
			Player.boostTimer[eid] = HORDES.boost.seconds;
			bundle.pickupPool.release(Slot.i[pickup]);
			removeEntity(ecs, pickup);
		}
	}
}

/** Ticks the dying FX window down; expiry recycles the slot and the entity — no alloc. */
export function dyingClock(bundle: HordeBundle, dt: number): void {
	const { ecs } = bundle;
	for (const eid of query(ecs, [Dying])) {
		Dying.t[eid] -= dt;
		if (Dying.t[eid] <= 0) {
			bundle.enemyPool.release(Slot.i[eid]);
			removeEntity(ecs, eid);
		}
	}
}

/** Bullet lifetime expiry: bullets that never landed go back to the pool. */
export function expireBullets(bundle: HordeBundle, dt: number): void {
	const { ecs } = bundle;
	for (const eid of query(ecs, [Lifetime, Bullet])) {
		Lifetime.t[eid] -= dt;
		if (Lifetime.t[eid] <= 0) {
			bundle.bulletPool.release(Slot.i[eid]);
			removeEntity(ecs, eid);
		}
	}
}
