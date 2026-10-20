// Enemy systems (ticket 02): seek steering (straight at the player, speed ramping over
// lifetime) and the shared movement integrator. No separation, no steering wobble —
// overlaps are the honest stress contract (spec).
import { hasComponent, query } from 'bitecs';
import { Dying, Enemy, Transform, Velocity } from '../components';
import { HORDES } from '../../config';
import type { HordeBundle } from '../world';

/** Point every live enemy at the player: velocity = ramped speed × direction. */
export function seekEnemies(bundle: HordeBundle, dt: number): void {
	const { ecs } = bundle;
	const playerEid = bundle.playerEid;
	const px = Transform.x[playerEid];
	const py = Transform.y[playerEid];

	for (const eid of query(ecs, [Enemy])) {
		if (hasComponent(ecs, eid, Dying)) continue; // the dying freeze where they were hit
		Enemy.age[eid] += dt;
		const ramp = Math.min(1, Enemy.age[eid] / HORDES.enemy.speedRamp);
		const speed =
			HORDES.enemy.speedStart + (HORDES.enemy.speedMax - HORDES.enemy.speedStart) * ramp;
		const dx = px - Transform.x[eid];
		const dy = py - Transform.y[eid];
		const dist = Math.sqrt(dx * dx + dy * dy) || 1;
		Velocity.x[eid] = (dx / dist) * speed;
		Velocity.y[eid] = (dy / dist) * speed;
	}
}

/**
 * Integrate every entity that carries a Velocity — enemies, bullets, the player. The
 * player clamps to the arena walls; everything else runs free (enemies overlap by
 * design, no separation pass exists).
 */
export function moveEntities(bundle: HordeBundle, dt: number): void {
	const { ecs } = bundle;
	const half = HORDES.arena.half;

	for (const eid of query(ecs, [Velocity])) {
		if (hasComponent(ecs, eid, Dying)) continue;
		Transform.x[eid] += Velocity.x[eid] * dt;
		Transform.y[eid] += Velocity.y[eid] * dt;
		if (eid === bundle.playerEid) {
			const reach = half - HORDES.collision.playerRadius;
			Transform.x[eid] = Math.max(-reach, Math.min(reach, Transform.x[eid]));
			Transform.y[eid] = Math.max(-reach, Math.min(reach, Transform.y[eid]));
		}
	}
}
