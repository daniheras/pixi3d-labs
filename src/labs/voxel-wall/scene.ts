// Lab 02 — voxel-wall (ticket 09): a floating sphere demolishes a voxel wall under Rapier
// physics. The choreography lives in ./config and is baked headless by ./bake; this file
// only assembles the scene graph and plays the take back on the reusable player
// (core/playback/player), so the take stays deterministic and pause/loop/scrub are free.
import { Material3D, Mesh3D, SphereGeometry } from '@pixi/3d';
import { createView3D } from '../core/world';
import { addLightRig } from '../core/theme';
import type { LabContext, LabScene } from '../core/shell';
import { createRoundedBoxGeometry } from '../core/geometry/rounded-box';
import { createPlayer, type Player } from '../core/playback/player';
import type { RecordingTimeline } from '../core/playback/timeline';
import { ensureTimeline } from './bake';
import { VOXEL_COUNT, VOXEL_WALL } from './config';

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
			addLightRig(view.root, VOXEL_WALL.lights);

			// the wall: one cream over the ink environment
			const voxelGeometry = createRoundedBoxGeometry(VOXEL_WALL.voxelGeometry);
			const cream = new Material3D(VOXEL_WALL.voxelMaterial);
			voxelMeshes = [];
			for (let i = 0; i < VOXEL_COUNT; i++) {
				const mesh = new Mesh3D({ geometry: voxelGeometry, material: cream });
				view.root.addChild(mesh);
				voxelMeshes.push(mesh);
			}

			// the subject — Signal Red, the only red object in the scene (ADR 0001)
			sphereMesh = new Mesh3D({
				geometry: new SphereGeometry(VOXEL_WALL.sphereGeometry),
				material: new Material3D(VOXEL_WALL.sphereMaterial),
			});
			view.root.addChild(sphereMesh);

			view.camera.mode = VOXEL_WALL.camera.mode;
			if (VOXEL_WALL.camera.mode === 'orthographic') view.camera.orthographicSize = VOXEL_WALL.camera.orthographicSize;
			view.camera.position.set(...VOXEL_WALL.camera.position);
			view.camera.lookAt({
				x: VOXEL_WALL.camera.target[0],
				y: VOXEL_WALL.camera.target[1],
				z: VOXEL_WALL.camera.target[2],
			});

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
