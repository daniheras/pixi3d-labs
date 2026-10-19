// Lab 02 — voxel-wall (ticket 09): a floating sphere demolishes a voxel wall under Rapier
// physics. The choreography is baked once — simulated headless at a fixed 60 Hz, recorded
// as per-tick poses — and played back by the reusable player (src/labs/player.ts), so the
// take is deterministic across devices and pause/loop/scrub are free. Bakes are cached per
// session: poses are app-independent, so a re-arrival replays the same recording.
import RAPIER from '@dimforge/rapier3d-compat';
import { AmbientLight, DirectionalLight, Material3D, Mesh3D, SphereGeometry } from '@pixi/3d';
import { createView3D, type LabContext, type LabScene } from './shell';
import { createRoundedBoxGeometry } from './geometry';
import { RecordingTimeline } from './timeline';
import { createPlayer, type Player } from './player';

// ---- choreography constants — ticket 09 starting values; implementation owns the decimals
const COLS = 9;
const ROWS = 5;
const DEPTH = 2;
const VOXEL = 1;
const VOXEL_COUNT = COLS * ROWS * DEPTH; // 90 bodies
const BODY_COUNT = VOXEL_COUNT + 1; // voxels + the sphere, recorded last

const DT = 1 / 60; // bake timestep; playback samples blends between ticks
const DT_MS = 1000 / 60;
const HOLD_MS = 5_000; // settled hold inside the loop, before the cut to pose zero
const APPROACH_SPEED = 10; // float-in speed, u/s (bake-tuned: at the wide face, the knockdown needs the energy)
const APPROACH_DIST = 14; // float distance before contact, u (long enough to still read as a float)
const BOB_AMP = 0.35; // float bob amplitude, u
const BOB_HZ = 0.9; // float bob frequency
const SPHERE_R = 1.1;
const SPHERE_DENSITY = 30; // vs voxel density 1 — the mass wins the demolition
const IMPACT_Y = 1.9; // float height: low, to undermine the base — the towers above the bite lose their support
const MAX_SETTLE_S = 7; // cap on post-impact simulation (observed settle ≈ 4.2s)
const REST_SPEED = 0.35; // body speed under which the scene counts as settled
const REST_TICKS = 15; // ...sustained this many consecutive ticks

// ---- bake — headless, fixed-step, deterministic

let bakeCache: Promise<RecordingTimeline> | null = null;

function ensureTimeline(): Promise<RecordingTimeline> {
	bakeCache ??= bake();
	return bakeCache;
}

async function bake(): Promise<RecordingTimeline> {
	await RAPIER.init();

	const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
	world.timestep = DT;

	// the ground: a fixed slab whose top face sits at y = 0 — physics-only, deliberately
	// invisible: the wall and its rubble float on the ink void (the user's call)
	const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
	world.createCollider(
		RAPIER.ColliderDesc.cuboid(40, 0.5, 24).setTranslation(0, -0.5, 0).setFriction(0.7),
		ground,
	);

	// the wall: dynamic voxels on a grid, resting on the floor
	const halfW = (COLS - 1) / 2;
	const halfD = (DEPTH - 1) / 2;
	const bodies: RAPIER.RigidBody[] = [];
	for (let z = 0; z < DEPTH; z++) {
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				const body = world.createRigidBody(
					RAPIER.RigidBodyDesc.dynamic()
						.setTranslation(
							(col - halfW) * VOXEL,
							row * VOXEL + VOXEL / 2,
							(z - halfD) * VOXEL,
						)
						// sleep off: the rest call is the bake's own velocity check, and a body
						// frozen mid-air by the solver's sleep would record a lie
						.setCanSleep(false)
						.setLinearDamping(0.1)
						.setAngularDamping(0.1),
				);
				world.createCollider(
					RAPIER.ColliderDesc.cuboid(VOXEL / 2, VOXEL / 2, VOXEL / 2)
						.setDensity(1)
						.setFriction(0.55)
						.setRestitution(0.05),
					body,
				);
				bodies.push(body);
			}
		}
	}

	// the sphere floats in along +z → -z at the wall's WIDE face (9×5 — the thin 2×5 end
	// reads as a side-swipe), level with the wall's mid height and a touch off-center so
	// the collapse isn't symmetric (kinematic — no gravity does the work); hands off to
	// the solver at first touch
	const wallFaceZ = DEPTH / 2; // the wall's +z face
	const contactZ = wallFaceZ + SPHERE_R; // sphere center z at first touch
	const startZ = contactZ + APPROACH_DIST;
	const HIT_X = -1.2; // slightly off-center: asymmetry sells the organic collapse
	const sphere = world.createRigidBody(
		RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(HIT_X, IMPACT_Y, startZ),
	);
	world.createCollider(
		RAPIER.ColliderDesc.ball(SPHERE_R).setDensity(SPHERE_DENSITY).setFriction(0.4).setRestitution(0),
		sphere,
	);
	bodies.push(sphere); // recorded last: index VOXEL_COUNT

	// pre-settle: let gravity take the spawn micro-gaps out of the stack before recording —
	// a wall recorded from freshly-coplanar contacts solves the impact as a slide, not a
	// topple (bake-tuned; the settle ticks are discarded, tick 0 is the resting wall)
	for (let i = 0; i < 90; i++) world.step();

	const approachTicks = Math.ceil(APPROACH_DIST / APPROACH_SPEED / DT);
	const maxTicks = 1 + approachTicks + Math.ceil(MAX_SETTLE_S / DT) + REST_TICKS + 10;
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
	const bobOmega = 2 * Math.PI * BOB_HZ;
	let impactTick = -1;
	while (ticks < maxTicks) {
		const t = ticks * DT;
		const z = startZ - APPROACH_SPEED * t;
		if (z <= contactZ) {
			impactTick = ticks;
			break;
		}
		const y = IMPACT_Y + BOB_AMP * Math.sin(bobOmega * t);
		sphere.setNextKinematicTranslation({ x: HIT_X, y, z });
		world.step();
		writeTick();
	}
	if (impactTick < 0) impactTick = ticks; // safety net; never with the constants above

	// handoff: the solver takes over, carrying the approach velocity (bob included)
	// into the scatter — the sphere rolls away with the rubble instead of vanishing
	const vy = BOB_AMP * bobOmega * Math.cos(bobOmega * impactTick * DT);
	sphere.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
	sphere.setLinvel({ x: 0, y: vy, z: -APPROACH_SPEED }, true);
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
		restRun = maxSpeed < REST_SPEED ? restRun + 1 : 0;
		if (restRun >= REST_TICKS) break;
	}
	const settledTick = ticks;

	return new RecordingTimeline(
		data.slice(0, ticks * BODY_COUNT * 7),
		BODY_COUNT,
		DT_MS,
		ticks,
		HOLD_MS,
		[
			{ name: 'approach', startMs: 0 },
			{ name: 'impact', startMs: (impactTick - 1) * DT_MS },
			{ name: 'settled', startMs: settledTick * DT_MS },
		],
	);
}

// ---- scene

export interface VoxelWallLab extends LabScene {
	/** Resolves once the bake is done and the player exists. */
	player: Promise<Player>;
}

export function createVoxelWallScene(): VoxelWallLab {
	let ctx: LabContext | null = null;
	let player: Player | null = null;
	let timeline: RecordingTimeline | null = null;
	let scratch: Float32Array | null = null;
	let voxelMeshes: Mesh3D[] = [];
	let sphereMesh: Mesh3D | null = null;

	// bake once per session; the player rides on it (fresh enough: setup resets it)
	const playerReady = ensureTimeline().then((tl) => {
		timeline = tl;
		scratch = new Float32Array(tl.bodyCount * 7);
		player = createPlayer(tl, { loop: true, autoplay: false });
		// poses follow every time change — advance from the ticker, seek from the UI
		player.onFrame(() => applyPose(player!.time));
		return player;
	});

	function applyPose(tMs: number): void {
		if (!timeline || !scratch || voxelMeshes.length === 0) return;
		timeline.sample(tMs, scratch);
		for (let i = 0; i < voxelMeshes.length; i++) {
			const o = i * 7;
			voxelMeshes[i].position.set(scratch[o], scratch[o + 1], scratch[o + 2]);
			voxelMeshes[i].quaternion.set(scratch[o + 3], scratch[o + 4], scratch[o + 5], scratch[o + 6]);
		}
		const o = VOXEL_COUNT * 7;
		if (sphereMesh) {
			sphereMesh.position.set(scratch[o], scratch[o + 1], scratch[o + 2]);
			sphereMesh.quaternion.set(scratch[o + 3], scratch[o + 4], scratch[o + 5], scratch[o + 6]);
		}
	}

	return {
		player: playerReady,

		async setup(context) {
			ctx = context;
			const p = await playerReady;

			const view = createView3D(context.app);

			// warm light rig as hello-cube, scaled to the bigger stage
			view.root.addChild(new AmbientLight({ color: 0xffd8c0, intensity: 0.3 }));
			const keyLight = new DirectionalLight({ color: 0xfff4e0, intensity: 4 });
			keyLight.position.set(8, 11, 13);
			keyLight.lookAt({ x: 0, y: 0, z: 0 });
			view.root.addChild(keyLight);
			const rimLight = new DirectionalLight({ color: 0xe5483c, intensity: 2 });
			rimLight.position.set(-11, -4, -9);
			rimLight.lookAt({ x: 0, y: 0, z: 0 });
			view.root.addChild(rimLight);

			// the wall: one cream over the ink environment
			const voxelGeometry = createRoundedBoxGeometry({ size: VOXEL, radius: 0.08, segments: 8 });
			const cream = new Material3D({ baseColor: 0xd8cfc7, metallic: 0.02, roughness: 0.5 });
			voxelMeshes = [];
			for (let i = 0; i < VOXEL_COUNT; i++) {
				const mesh = new Mesh3D({ geometry: voxelGeometry, material: cream });
				view.root.addChild(mesh);
				voxelMeshes.push(mesh);
			}

			// the subject — Signal Red, the only red object in the scene (ADR 0001)
			sphereMesh = new Mesh3D({
				geometry: new SphereGeometry({ radius: SPHERE_R, widthSegments: 48, heightSegments: 32 }),
				material: new Material3D({ baseColor: 0xe5483c, metallic: 0.05, roughness: 0.35 }),
			});
			view.root.addChild(sphereMesh);

			// fixed cinematic 3/4 on the wall's mid height
			view.camera.position.set(11, 6.5, 14.5);
			view.camera.lookAt({ x: 0, y: 2.2, z: 0 });

			// per-arrival reset, then autoplay only when motion is allowed (ticket 09 Q11):
			// reduced motion and ?static freeze at pose zero with the player paused
			p.pause();
			p.seek(0);
			applyPose(0);
			// dev/capture affordance: ?t=<ms> freezes the take at that instant, so any pose
			// (mid-collapse included) is inspectable and photographable deterministically
			const tParam = new URLSearchParams(location.search).get('t');
			if (tParam !== null) {
				p.seek(Number(tParam) || 0);
			} else if (!context.reducedMotion && !context.static) {
				p.play();
			}
		},

		update(ticker) {
			// the player is the lab's clock; the shell's ticker is the player's
			player?.advance(ticker.deltaMS);
		},

		dispose() {
			voxelMeshes = [];
			sphereMesh = null; // the scene graph goes with app.destroy, shell-side
		},
	};
}
