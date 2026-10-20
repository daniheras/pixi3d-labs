// The horde ECS world (ticket 01): bitecs world, component stores, preallocated mesh
// pools and the player entity, built and torn down by one builder. The scene calls this
// on setup AND on every game-over restart — application and shell never notice.
//
// bitecs is lab-confined (ADR 0004): nothing here is shaped for reuse beyond hordes.
import {
	Container3D,
	Material3D,
	Mesh3D,
	SphereGeometry,
	type Geometry3D,
	type View3D,
} from '@pixi/3d';
import { addComponent, addEntity, createWorld, type World, type EntityId } from 'bitecs';
import { HORDES } from '../config';
import { createRoundedBoxGeometry } from '../../core/geometry/rounded-box';
import { COMPONENT_STORES, Player, Transform, Velocity } from './components';
import { MeshPool } from './mesh-pool';
import { createRng, type Rng } from './rng';
import { SpatialHash } from './systems/spatial-hash';

/**
 * Director-owned timers, counters and rolls: mutable state that no single system owns,
 * held in one bundle field so systems stay pure (functions over this state, writes
 * back here). The seeded rng lives here too — spawn and pickup rolls share it.
 */
export interface DirectorState {
	/** Countdown to the next spawn batch. */
	spawnTimer: number;
	/** Countdown to the next pickup roll. */
	pickupTimer: number;
	/** Total spawned this game; rotates the spawn walls around the sides. */
	spawned: number;
	/** Seconds since game start — the render sync reads it for the invuln blink phase. */
	elapsed: number;
	/** True once the player's last life went; the scene freezes stepping until its restart. */
	gameOver: boolean;
	/** Kills so far this game — HUD readout only. */
	kills: number;
	/** Seeded RNG for the spawn director and pickup rolls (reproducible under ?static). */
	rng: Rng;
}

/** Everything the systems and the render sync touch: the ECS world and its render-side pools. */
export interface HordeBundle {
	/** The bitecs world — entities, component shapes, queries. */
	ecs: World;
	director: DirectorState;
	/** Scene-graph host of every pooled mesh; destroyed and rebuilt per game. */
	layer: Container3D;
	/** The one player mesh, never pooled. */
	playerMesh: Mesh3D;
	/** The player's eid for the systems that address it directly. */
	playerEid: EntityId;
	enemyPool: MeshPool;
	bulletPool: MeshPool;
	pickupPool: MeshPool;
	// every-frame collision substrate; rebuilt by the step pipeline (see systems/)
	grid: SpatialHash;
	/** Shared geometries owned by the bundle, destroyed on teardown. */
	geometries: Geometry3D[];
}

/**
 * Build a fresh horde world under `view`. `seed` pins the spawn/pickup rolls — `?static`
 * passes a constant so the capture frame is reproducible (shell contract). Live play
 * passes nothing and gets a fresh unpredictable seed.
 */
export function createHordeBundle(view: View3D, seed?: number): HordeBundle {
	const layer = new Container3D();
	view.root.addChild(layer);

	const enemyGeometry = createRoundedBoxGeometry(HORDES.enemy.geometry);
	const bulletGeometry = new SphereGeometry(HORDES.bullet.geometry);
	const pickupGeometry = new SphereGeometry(HORDES.pickup.geometry);
	const playerGeometry = new SphereGeometry(HORDES.player.geometry);

	const enemyPool = new MeshPool(layer, enemyGeometry, HORDES.enemy.material, HORDES.cap.enemies, HORDES.visual.enemy);
	const bulletPool = new MeshPool(layer, bulletGeometry, HORDES.bullet.material, HORDES.cap.bullets, HORDES.visual.bullet);
	const pickupPool = new MeshPool(layer, pickupGeometry, HORDES.pickup.material, HORDES.pickup.maxAlive, HORDES.visual.pickup);

	const playerMesh = new Mesh3D({
		geometry: playerGeometry,
		material: new Material3D(HORDES.player.material),
	});
	playerMesh.scale.set(HORDES.visual.player, HORDES.visual.player, HORDES.visual.player);
	layer.addChild(playerMesh);

	const ecs = createWorld();
	const playerEid: EntityId = addEntity(ecs);
	addComponent(ecs, playerEid, Player);
	addComponent(ecs, playerEid, Transform);
	addComponent(ecs, playerEid, Velocity);
	Transform.x[playerEid] = 0;
	Transform.y[playerEid] = 0;
	Velocity.x[playerEid] = 0;
	Velocity.y[playerEid] = 0;
	Player.lives[playerEid] = HORDES.player.lives;
	Player.fireTimer[playerEid] = HORDES.player.fireInterval;
	Player.invulnTimer[playerEid] = 0;
	Player.boostTimer[playerEid] = 0;

	return {
		ecs,
		director: {
			spawnTimer: 0,
			pickupTimer: 0,
			spawned: 0,
			kills: 0,
			elapsed: 0,
			gameOver: false,
			rng: createRng(seed ?? Math.floor(Math.random() * 2 ** 31)),
		},
		layer,
		playerMesh,
		playerEid,
		enemyPool,
		bulletPool,
		pickupPool,
		grid: new SpatialHash(HORDES.collision.cell),
		geometries: [enemyGeometry, bulletGeometry, pickupGeometry, playerGeometry],
	};
}

/**
 * Tear a horde world down: destroy the pooled meshes and their per-entity materials
 * (Destroy3DOptions default keeps shared geometry alive; it is destroyed explicitly
 * below), release each shared geometry's renderer side, and zero the component stores
 * — the next game-over restart rebuilds from clean tables. bitecs's own world object
 * is throwaway once live entities are gone.
 */
export function destroyHordeBundle(bundle: HordeBundle): void {
	bundle.layer.destroy({ children: true, material: true });
	for (const geometry of bundle.geometries) geometry.destroy();
	// zero every SoA field across every store: ghost lengths would resurrect entities
	for (const store of COMPONENT_STORES) {
		for (const field of Object.values(store)) {
			field.length = 0;
		}
	}
}
