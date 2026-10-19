// Lab 03 — ak47 config: everything about the lab that isn't wiring — the asset URL,
// the failing bulb, the light rig poses, the camera. Implementation owns the decimals.
import type { LightRigConfig } from '../core/theme';

export const AK47 = {
	/** The converted asset, served from public/models (see scene.ts for provenance). */
	model: {
		url: '/models/ak47.glb',
	},
	/**
	 * The room: a slightly lifted hemisphere over the world default — the metal needs
	 * something to reflect so its body reads instead of going pure black.
	 */
	environment: {
		skyColor: 0x4a3a30,
		groundColor: 0x181412,
	},
	/**
	 * The hanging bulb: a warm point light overhead that fails like an old filament —
	 * the one dominant source, everything else nearly dark. Intensity falls with r², so
	 * the base level is tuned for the bulb-to-gun distance of ~5.7 units.
	 */
	bulb: {
		position: [0, 4, 1.2],
		color: 0xffc873,
		intensity: 150,
		range: 14,
		/**
		 * Deterministic failure pattern. Deep dips ride the slow gate (~2 per second at
		 * most) so the light never strobes; the fast grain only varies level shallowly.
		 */
		/** Level held when motion must stand still (reduced motion, ?static). */
		flicker: {
			/** Fast shallow grain, Hz. */
			flutterHz: 13,
			/** Slow breathing of the base level, Hz. */
			wanderHz: 1.7,
			/** Dropout gate cadence, Hz. */
			gateHz: 1.9,
			/** The filament never dies completely. */
			floor: 0.05,
			/** Level held when motion must stand still (reduced motion, ?static). */
			steadyLevel: 0.85,
		},
	},
	/** House three-way rig, graded way down: near-dark room, the bulb is the key. */
	lights: {
		ambient: { intensity: 0.1 },
		key: { intensity: 1.0, position: [30, 40, 50] },
		rim: { intensity: 1.2, position: [-45, -18, -35] },
	} satisfies LightRigConfig,
	/** Fixed camera: 3/4 view from slightly above, gun and hanging bulb in frame. */
	camera: {
		position: [4, 3.2, 8],
		target: [0, 0.9, 0],
		/** The gun's bounding sphere around the target, for the responsive fit. */
		fitRadius: 5.5,
		/** Headroom over the sphere fit, so the muzzle and stock never kiss the edge. */
		fitMargin: 1.15,
	},
	/** Turntable drag: horizontal pointer travel yaws the gun at this rate (rad/px). */
	drag: {
		radiansPerPixel: 0.012,
	},
	/**
	 * The hover outline: a shell baked into the asset — vertices pushed 0.07 units along
	 * position-smoothed normals, winding flipped so back-face cull leaves only the
	 * silhouette halo, unlit bone white (the palette's cream). The scene reveals it while
	 * the pointer is over the gun.
	 */
	outline: {
		label: 'Outline',
	},
	/**
	 * Screen-anchored callouts: each label sits still at its slot (fractions of the stage
	 * box) while its leader line's far end tracks the part's projected position as the gun
	 * turns. Anchors are model-space offsets — the gun spans ~10 units along x, muzzle at
	 * +x — so anchors parented to the model inherit the drag rotation. Listed in stagger
	 * order: the reveal sweeps stock → muzzle (reading order, and how the rifle shoulders
	 * into you).
	 */
	labels: {
		parts: [
			{ label: 'Stock', at: [-4.7, 0.55, 0], slot: [0.12, 0.36] },
			{ label: 'Grip', at: [-2.15, -0.55, 0], slot: [0.3, 0.92] },
			{ label: 'Magazine', at: [0.6, -0.28, 0], slot: [0.62, 0.94] },
			{ label: 'Handguard', at: [2, 0.75, 0], slot: [0.8, 0.14] },
			{ label: 'Muzzle', at: [5, 0.7, 0], slot: [0.88, 0.4] },
		],
	},
} as const;
