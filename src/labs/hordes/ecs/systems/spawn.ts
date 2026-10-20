// Spawn director (ticket 02): the difficulty ramp as pure timer state — batch size
// grows forever, the pool caps at `cap.enemies` by recycling the oldest enemy
// instantly (no FX per spec). Pickup rolls share the same director state and rng.
// `seedStaticFrame` is the ?static capture path: deterministic mid-horde seeding.
import { addComponent, addEntity, hasComponent, query, removeEntity } from 'bitecs';
import {
	Bullet,
	Dying,
	Enemy,
	Lifetime,
	Pickup,
	Slot,
	Transform,
	Velocity,
} from '../components';
import { HORDES } from '../../config';
import type { HordeBundle } from '../world';

/**
 * Place the next spawn: walls rotate in spawn order (0 −z, 1 +z, 2 −x, 3 +x), the
 * point along the wall rolls from the seeded rng, a few units outside the arena.
 * Needs `director.spawned` bumped by the caller.
 */
function placeOnWall(bundle: HordeBundle): { x: number; y: number } {
	const half = HORDES.arena.half;
	const out = half + HORDES.arena.edgeOutset;
	// random point along the wall, one unit clear of the corners
	const along = (bundle.director.rng() * 2 - 1) * (half - 1);
	const side = bundle.director.spawned % 4;
	switch (side) {
		case 0:
			return { x: along, y: -out };
		case 1:
			return { x: along, y: out };
		case 2:
			return { x: -out, y: along };
		default:
			return { x: out, y: along };
	}
}

/** Create one enemy at (x, y) already aimed and moving at the ramp's starting speed; -1 if the pool is dry. */
function spawnEnemy(bundle: HordeBundle, x: number, y: number): number {
	const slot = bundle.enemyPool.acquire();
	if (slot === -1) return -1;
	const { ecs } = bundle;
	const eid = addEntity(ecs);
	addComponent(ecs, eid, Enemy);
	addComponent(ecs, eid, Transform);
	addComponent(ecs, eid, Velocity);
	addComponent(ecs, eid, Slot);
	Transform.x[eid] = x;
	Transform.y[eid] = y;
	const px = Transform.x[bundle.playerEid];
	const py = Transform.y[bundle.playerEid];
	const dx = px - x;
	const dy = py - y;
	const dist = Math.sqrt(dx * dx + dy * dy) || 1;
	Velocity.x[eid] = (dx / dist) * HORDES.enemy.speedStart;
	Velocity.y[eid] = (dy / dist) * HORDES.enemy.speedStart;
	Enemy.age[eid] = 0;
	Slot.i[eid] = slot;
	return eid;
}

/**
 * The oldest alive enemy that is not busy dying (dying slots are mid-FX and are spent
 * either way); removes it — instant, no dying state, per the cap-recycle contract.
 */
function removeOldestEnemy(bundle: HordeBundle): boolean {
	const { ecs } = bundle;
	for (const eid of query(ecs, [Enemy])) {
		if (hasComponent(ecs, eid, Dying)) continue;
		bundle.enemyPool.release(Slot.i[eid]);
		removeEntity(ecs, eid);
		return true;
	}
	return false;
}

/**
 * Advance the spawn director one tick: cadence timer, batch spawn. The batch grows
 * from `HORDES.elapsed` — one extra enemy per batch every `HORDES.spawn.ramp` seconds
 * (a ramp that never ends). At the pool cap the oldest alive enemy recycles instantly
 * and the batch continues, so the difficulty keeps ramping against a bounded,
 * repeatable entity budget.
 */
export function spawnDirector(bundle: HordeBundle, dt: number): void {
	const d = bundle.director;

	d.spawnTimer -= dt;
	if (d.spawnTimer > 0) return;
	d.spawnTimer += HORDES.spawn.interval;

	// the ramp reads straight from the game clock: no second timer to drift
	const batch = HORDES.spawn.batch + Math.floor(d.elapsed / HORDES.spawn.ramp);

	for (let i = 0; i < batch; i++) {
		const at = placeOnWall(bundle);
		d.spawned++;
		if (spawnEnemy(bundle, at.x, at.y) !== -1) continue;
		if (!removeOldestEnemy(bundle)) break; // everything is dying — wait it out
		const eid = spawnEnemy(bundle, at.x, at.y);
		if (eid === -1) break;
	}
}

/** Pickup rolls: every `HORDES.pickup.interval` s, a 50% roll, never past maxAlive. */
export function pickupRoll(bundle: HordeBundle, dt: number): void {
	const d = bundle.director;
	d.pickupTimer -= dt;
	if (d.pickupTimer > 0) return;
	d.pickupTimer += HORDES.pickup.interval;
	if (d.rng() >= 0.5) return; // spec: a spawn chance, not a guarantee

	const slot = bundle.pickupPool.acquire();
	if (slot === -1) return; // maxAlive respected: the pool is built to exactly that size

	const { ecs } = bundle;
	const eid = addEntity(ecs);
	addComponent(ecs, eid, Pickup);
	addComponent(ecs, eid, Transform);
	addComponent(ecs, eid, Velocity);
	addComponent(ecs, eid, Slot);
	const half = HORDES.arena.half;
	Transform.x[eid] = (d.rng() * 2 - 1) * (half - 2);
	Transform.y[eid] = (d.rng() * 2 - 1) * (half - 2);
	Velocity.x[eid] = 0;
	Velocity.y[eid] = 0;
	Slot.i[eid] = slot;
}

/**
 * ?static capture seeding (spec): the deterministic rng result — a mid-horde ring of
 * enemies around the player, a few bullets in flight, one pickup nearby. No gameplay
 * clock: the shell renders exactly one frame right after this.
 */
export function seedStaticFrame(bundle: HordeBundle): void {
	const d = bundle.director;
	const half = HORDES.arena.half;
	const px = Transform.x[bundle.playerEid];
	const py = Transform.y[bundle.playerEid];

	for (let i = 0; i < HORDES.static.enemies; i++) {
		const angle = (i / HORDES.static.enemies) * Math.PI * 2 + d.rng() * 0.25;
		const radius = 14 + d.rng() * (half - 20);
		const eid = spawnEnemy(bundle, px + Math.cos(angle) * radius, py + Math.sin(angle) * radius);
		if (eid === -1) break;
		// scatter their ramp stages so the ring reads as different ages
		Enemy.age[eid] = d.rng() * HORDES.enemy.speedRamp * 0.75;
	}

	for (let i = 0; i < HORDES.static.bullets; i++) {
		const slot = bundle.bulletPool.acquire();
		if (slot === -1) break;
		const angle = d.rng() * Math.PI * 2;
		const dist = 3 + d.rng() * 9;
		const { ecs } = bundle;
		const eid = addEntity(ecs);
		addComponent(ecs, eid, Bullet);
		addComponent(ecs, eid, Transform);
		addComponent(ecs, eid, Velocity);
		addComponent(ecs, eid, Lifetime);
		addComponent(ecs, eid, Slot);
		Transform.x[eid] = px + Math.cos(angle) * dist;
		Transform.y[eid] = py + Math.sin(angle) * dist;
		Velocity.x[eid] = -Math.sin(angle) * HORDES.bullet.speed * 0.1;
		Velocity.y[eid] = Math.cos(angle) * HORDES.bullet.speed * 0.1;
		Lifetime.t[eid] = HORDES.bullet.lifetime;
		Slot.i[eid] = slot;
	}

	const slot = bundle.pickupPool.acquire();
	if (slot !== -1) {
		const { ecs } = bundle;
		const eid = addEntity(ecs);
		addComponent(ecs, eid, Pickup);
		addComponent(ecs, eid, Transform);
		addComponent(ecs, eid, Velocity);
		addComponent(ecs, eid, Slot);
		Transform.x[eid] = px + 3;
		Transform.y[eid] = py - 2;
		Velocity.x[eid] = 0;
		Velocity.y[eid] = 0;
		Slot.i[eid] = slot;
	}
}
