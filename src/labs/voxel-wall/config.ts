// voxel-wall config (ticket 09): everything about the lab that isn't wiring — the
// demolition choreography (ticket 09 starting values; implementation owns the decimals),
// the skin and lights, the camera. `bake.ts` reads the choreography; `scene.ts` the rest.
import { PALETTE, type LightRigConfig } from '../core/theme';

/** The demolition choreography, self-contained so everything down-derives from it. */
const CHOREOGRAPHY = {
	/** Wall grid: cols × rows × depth voxel bodies. */
	cols: 9,
	rows: 5,
	depth: 2,
	/** Voxel edge length, u. */
	voxel: 1,

	/** Bake timestep, s; playback samples blends between ticks. */
	dt: 1 / 60,
	/** Bake timestep in ms (the playback step). */
	dtMs: 1000 / 60,
	/** Settled hold inside the loop, ms, before the cut to pose zero. */
	holdMs: 5_000,

	/** Float-in approach along +z → -z at the wall's WIDE face (9×5 — the thin
	 * 2×5 end reads as a side-swipe). */
	approach: {
		/** Float-in speed, u/s (bake-tuned: at the wide face, the knockdown needs the energy). */
		speed: 10,
		/** Float distance before contact, u (long enough to still read as a float). */
		dist: 14,
		/** Sphere x at impact — slightly off-center: asymmetry sells the organic collapse. */
		hitX: -1.2,
	},
	/** Float bob riding the approach. */
	bob: {
		/** Amplitude, u. */
		amp: 0.35,
		/** Frequency, Hz. */
		hz: 0.9,
	},

	sphere: {
		/** Radius, u. */
		radius: 1.1,
		/** Density vs voxel density 1 — the mass wins the demolition. */
		density: 30,
	},
	/** Float height, u: low, to undermine the base — the towers above the bite lose
	 * their support. */
	impactY: 1.9,

	settle: {
		/** Cap on post-impact simulation, s (observed settle ≈ 4.2s). */
		maxSeconds: 7,
		/** Body speed under which the scene counts as settled. */
		restSpeed: 0.35,
		/** ...settled sustained this many consecutive ticks. */
		restTicks: 15,
	},
} as const;

export const VOXEL_WALL = {
	choreography: CHOREOGRAPHY,

	/** The skin: cream voxels over the ink environment, Signal Red sphere (ADR 0001 —
	 * the only red object in the scene). */
	voxelGeometry: { size: CHOREOGRAPHY.voxel, radius: 0.08, segments: 8 },
	voxelMaterial: { baseColor: PALETTE.cream, metallic: 0.02, roughness: 0.5 },
	sphereGeometry: { radius: CHOREOGRAPHY.sphere.radius, widthSegments: 48, heightSegments: 32 },
	sphereMaterial: { baseColor: PALETTE.red, metallic: 0.05, roughness: 0.35 },

	/** House three-way rig, scaled to the bigger stage. */
	lights: {
		ambient: { intensity: 0.3 },
		key: { intensity: 4, position: [8, 11, 13] },
		rim: { intensity: 2, position: [-11, -4, -9] },
	} satisfies LightRigConfig,

	/** Fixed cinematic framing on the wall's mid height. Camera mode is orthographic —
	 * no foreshortening, editor-flat: an experiment to see the demolition as a diagram. */
	camera: {
		mode: 'orthographic' as const,
		/** Half-extent of the ortho view, u: sized to keep the wall (9×5) and the approach
		 * legible without dead space. Tune alongside `position`. */
		orthographicSize: 15,
		position: [11, 6.5, 14.5],
		target: [0, 2.2, 0],
	},
} as const;

/** Voxel bodies on the wall grid. */
export const VOXEL_COUNT = CHOREOGRAPHY.cols * CHOREOGRAPHY.rows * CHOREOGRAPHY.depth;
/** Total recorded bodies: the voxels plus the sphere, recorded last. */
export const BODY_COUNT = VOXEL_COUNT + 1;
