// The voxel-wall bake: the choreography is simulated headless with Rapier at a fixed
// 60 Hz and recorded as per-tick poses (ticket 09 / ADR 0002), so the take is
// deterministic across devices and the scene just plays it back. Choreography constants
// live in ./config; the pose storage is the core/playback timeline machinery.
import RAPIER from '@dimforge/rapier3d-compat';
import { RecordingTimeline } from '../core/playback/timeline';
import { BODY_COUNT, VOXEL_COUNT, VOXEL_WALL } from './config';

const CH = VOXEL_WALL.choreography;

// Bake once per session: poses are app-independent, so a re-arrival replays the same
// recording.
let bakeCache: Promise<RecordingTimeline> | null = null;

/** The baked take, cached per session. */
export function ensureTimeline(): Promise<RecordingTimeline> {
	bakeCache ??= bake();
	return bakeCache;
}

async function bake(): Promise<RecordingTimeline> {
	await RAPIER.init();

	const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
	world.timestep = CH.dt;

	// the ground: a fixed slab whose top face sits at y = 0 — physics-only, deliberately
	// invisible: the wall and its rubble float on the ink void (the user's call)
	const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
	world.createCollider(
		RAPIER.ColliderDesc.cuboid(40, 0.5, 24).setTranslation(0, -0.5, 0).setFriction(0.7),
		ground,
	);

	// the wall: dynamic voxels on a grid, resting on the floor
	const halfW = (CH.cols - 1) / 2;
	const halfD = (CH.depth - 1) / 2;
	const bodies: RAPIER.RigidBody[] = [];
	for (let z = 0; z < CH.depth; z++) {
		for (let row = 0; row < CH.rows; row++) {
			for (let col = 0; col < CH.cols; col++) {
				const body = world.createRigidBody(
					RAPIER.RigidBodyDesc.dynamic()
						.setTranslation(
							(col - halfW) * CH.voxel,
							row * CH.voxel + CH.voxel / 2,
							(z - halfD) * CH.voxel,
						)
						// sleep off: the rest call is the bake's own velocity check, and a body
						// frozen mid-air by the solver's sleep would record a lie
						.setCanSleep(false)
						.setLinearDamping(0.1)
						.setAngularDamping(0.1),
				);
				world.createCollider(
					RAPIER.ColliderDesc.cuboid(CH.voxel / 2, CH.voxel / 2, CH.voxel / 2)
						.setDensity(1)
						.setFriction(0.55)
						.setRestitution(0.05),
					body,
				);
				bodies.push(body);
			}
		}
	}

	// the sphere floats in along +z → -z at the wall's WIDE face (see config), level
	// with the wall's mid height (kinematic — no gravity does the work); hands off to
	// the solver at first touch
	const wallFaceZ = CH.depth / 2; // the wall's +z face
	const contactZ = wallFaceZ + CH.sphere.radius; // sphere center z at first touch
	const startZ = contactZ + CH.approach.dist;
	const sphere = world.createRigidBody(
		RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(CH.approach.hitX, CH.impactY, startZ),
	);
	world.createCollider(
		RAPIER.ColliderDesc.ball(CH.sphere.radius).setDensity(CH.sphere.density).setFriction(0.4).setRestitution(0),
		sphere,
	);
	bodies.push(sphere); // recorded last: index VOXEL_COUNT

	// pre-settle: let gravity take the spawn micro-gaps out of the stack before recording —
	// a wall recorded from freshly-coplanar contacts solves the impact as a slide, not a
	// topple (bake-tuned; the settle ticks are discarded, tick 0 is the resting wall)
	for (let i = 0; i < 90; i++) world.step();

	const approachTicks = Math.ceil(CH.approach.dist / CH.approach.speed / CH.dt);
	const maxTicks = 1 + approachTicks + Math.ceil(CH.settle.maxSeconds / CH.dt) + CH.settle.restTicks + 10;
	const data = new Float32Array(maxTicks * BODY_COUNT * 7);
	let ticks = 0;
	const writeTick = (): void => {
		for (let b = 0; b < bodies.length; b++) {
			const p = bodies[b].translation();
			const r = bodies[b].rotation();
			const o = (ticks * BODY_COUNT + b) * 7;
			data[o] = p.x;
			data[o + 1] = p.y;
			data[o + 2] = p.z;
			data[o + 3] = r.x;
			data[o + 4] = r.y;
			data[o + 5] = r.z;
			data[o + 6] = r.w;
		}
		ticks++;
	};

	writeTick(); // tick 0 — pose zero: the wall standing, the sphere at its float origin

	// approach: scripted drift with a bob
	const bobOmega = 2 * Math.PI * CH.bob.hz;
	let impactTick = -1;
	while (ticks < maxTicks) {
		const t = ticks * CH.dt;
		const z = startZ - CH.approach.speed * t;
		if (z <= contactZ) {
			impactTick = ticks;
			break;
		}
		const y = CH.impactY + CH.bob.amp * Math.sin(bobOmega * t);
		sphere.setNextKinematicTranslation({ x: CH.approach.hitX, y, z });
		world.step();
		writeTick();
	}
	if (impactTick < 0) impactTick = ticks; // safety net; never with the constants in config

	// handoff: the solver takes over, carrying the approach velocity (bob included)
	// into the scatter — the sphere rolls away with the rubble instead of vanishing
	const vy = CH.bob.amp * bobOmega * Math.cos(bobOmega * impactTick * CH.dt);
	sphere.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
	sphere.setLinvel({ x: 0, y: vy, z: -CH.approach.speed }, true);
	// damping kills the endless-roll tail so the bake can actually reach rest
	sphere.setLinearDamping(0.6);
	sphere.setAngularDamping(0.6);

	// impact → settle: run until every body is slow, then freeze into the hold
	let restRun = 0;
	while (ticks < maxTicks) {
		world.step();
		writeTick();
		let maxSpeed = 0;
		for (const body of bodies) {
			const v = body.linvel();
			const w = body.angvel();
			maxSpeed = Math.max(maxSpeed, Math.hypot(v.x, v.y, v.z), Math.hypot(w.x, w.y, w.z) * 0.4);
		}
		restRun = maxSpeed < CH.settle.restSpeed ? restRun + 1 : 0;
		if (restRun >= CH.settle.restTicks) break;
	}
	const settledTick = ticks;

	return new RecordingTimeline(
		data.slice(0, ticks * BODY_COUNT * 7),
		BODY_COUNT,
		CH.dtMs,
		ticks,
		CH.holdMs,
		[
			{ name: 'approach', startMs: 0 },
			{ name: 'impact', startMs: (impactTick - 1) * CH.dtMs },
			{ name: 'settled', startMs: settledTick * CH.dtMs },
		],
	);
}
