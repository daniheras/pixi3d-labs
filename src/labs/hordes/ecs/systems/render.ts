// Render stage (ticket 02): the one place that reads bitES tables and writes Mesh3D
// transforms. The ECS world is the source of truth; this is a mirror, not a second
// brain — no gameplay math happens here, only the render-side allowance the spec
// grants: the dying jitter (ECS physics untouched) and the player's FX (hurt tint,
// invuln blink).
import { hasComponent, query } from 'bitecs';
import {
	Bullet,
	Dying,
	Enemy,
	Pickup,
	Player,
	Slot,
	Transform,
} from '../components';
import { HORDES } from '../../config';
import type { HordeBundle } from '../world';

/**
 * One render pass: pool slots live at fixed graph positions already, so the per-frame
 * work is a write per active entity plus the FX deltas. `reducedMotion` drops the
 * shake and blink; the lab owns what degrades (shell contract).
 */
export function renderSync(bundle: HordeBundle, reducedMotion: boolean): void {
	const { ecs } = bundle;

	// player first — its mesh is owned, never pooled
	const playerEid = bundle.playerEid;
	const playerMesh = bundle.playerMesh;
	playerMesh.position.set(
		Transform.x[playerEid],
		HORDES.height.player,
		Transform.y[playerEid],
	);
	if (Player.hurtTimer[playerEid] > 0) {
		playerMesh.material.baseColor = HORDES.hurt.flashColor;
	} else if (playerMesh.material.baseColor !== HORDES.player.material.baseColor) {
		playerMesh.material.baseColor = HORDES.player.material.baseColor;
	}
	// blink through the invuln window; 10 Hz phases read clean at game speed
	if (Player.invulnTimer[playerEid] > 0 && !reducedMotion) {
		playerMesh.visible = Math.floor(bundle.director.elapsed * 10) % 2 === 0;
	} else {
		playerMesh.visible = true;
	}

	// enemies: shared geometry, per-entity material, dying tint + jitter (render only)
	for (const eid of query(ecs, [Enemy])) {
		const mesh = bundle.enemyPool.getMesh(Slot.i[eid]);
		const dying = hasComponent(ecs, eid, Dying);
		let x = Transform.x[eid];
		let y = Transform.y[eid];
		if (dying) {
			mesh.material.baseColor = HORDES.death.flashColor;
			if (!reducedMotion) {
				const amp = HORDES.death.shake;
				x += (bundle.director.rng() * 2 - 1) * amp;
				y += (bundle.director.rng() * 2 - 1) * amp;
			}
		}
		mesh.position.set(x, HORDES.height.enemy, y);
	}

	// bullets: nothing but a position write
	for (const eid of query(ecs, [Bullet])) {
		const mesh = bundle.bulletPool.getMesh(Slot.i[eid]);
		mesh.position.set(Transform.x[eid], HORDES.height.bullet, Transform.y[eid]);
	}

	// pickups: same, one write each (never more than two alive)
	for (const eid of query(ecs, [Pickup])) {
		const mesh = bundle.pickupPool.getMesh(Slot.i[eid]);
		mesh.position.set(Transform.x[eid], HORDES.height.pickup, Transform.y[eid]);
	}
}
