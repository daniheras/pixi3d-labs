// interaction config (lab 04): everything about the lab that isn't wiring — the L path of
// floating cubes, the hop choreography, hover tint, lights, camera. Implementation owns the
// wiring; tuning happens here. The animation reasoning lives in .scratch/interaction/spec.md.
import { PALETTE, type LightRigConfig } from '../core/theme';

/** The path: a flat L of cubes — two legs of `leg` cubes sharing the corner (total
 * 2·leg − 1). Chain order is walk order: leg tip → corner → leg tip. Cube centers sit on
 * the y = height plane, spaced so an air gap keeps them reading as floating islands. */
const PATH = {
	/** Cubes per leg, corner included in both legs. */
	leg: 4,
	/** Full edge length of a cube, u. */
	cubeSize: 1,
	/** Air gap between cubes, u. */
	gap: 0.3,
	/** Height of the cube centers, u — the whole path floats on nothing. */
	height: 0,
} as const;

/** Derived: center-to-center spacing between adjacent cubes. */
export const PATH_SPACING = PATH.cubeSize + PATH.gap;
/** Derived: cubes in the chain. */
export const PATH_LENGTH = PATH.leg * 2 - 1;

export const INTERACTION = {
	path: PATH,

	/** The cubes: matte cream over the ink environment (voxel-wall's recipe) — the sphere
	 * stays the only red object in the scene (ADR 0001). */
	cubeGeometry: { size: PATH.cubeSize, radius: 0.12, segments: 8 },
	cubeMaterial: { baseColor: PALETTE.cream, metallic: 0.02, roughness: 0.5 },

	/** Hover: the cube under the pointer tints toward the house hot red, ak47's hover accent. */
	hover: {
		color: PALETTE.redBright,
		/** Time to the full tint, ms; the fade back out runs at the same pace. */
		fadeMs: 150,
	},

	/** The subject: Signal Red, resting on the first cube of the chain. */
	sphereGeometry: { radius: 0.33, widthSegments: 48, heightSegments: 32 },
	sphereMaterial: { baseColor: PALETTE.red, metallic: 0.05, roughness: 0.35 },

	/** The hop choreography. Emil's framework: the click's response must be immediate
	 * (launch on the next frame, no windup), the launch strong ease-out, the arc physics —
	 * driven by the eased progress so the hop reads as a quick lift into a long soft
	 * descent. Squash on landing is the 3D analog of press feedback; the next hop launches
	 * under it, so chains never dead-stop between cubes. */
	hop: {
		/** Time per cube-to-cube hop, ms. */
		durationMs: 350,
		/** Arc peak above the rest height, u. */
		arcHeight: 0.55,
		/** Horizontal ease-out exponent: progress = 1 − (1 − t)^exponent. */
		exponent: 4,
		/** Stretch along y at peak vertical speed (xz counter-scales at half that rate). */
		stretch: 0.08,
		/** Landing squash: y-scale dips this far below 1 at impact, xz conserved. */
		squash: 0.18,
		/** Squash recovery time, ms. */
		squashMs: 130,
		/** Reduced motion: no hops — teleport, then settle from this scale deficit up to 1. */
		settleScale: 0.96,
		/** Reduced-motion settle time, ms. */
		settleMs: 150,
	},

	/** House three-way rig; the key casts the shadows (Q10) over the whole path. The key
	 * rides high (~62° elevation): the path has no ground plane, so every cube top is the
	 * only shadow receiver — a lower key pushes the sphere's shadow off into the void. */
	lights: {
		ambient: { intensity: 0.3 },
		key: {
			intensity: 4,
			position: [5, 16, 7],
			castShadow: true,
			shadow: { center: [1.5, 0, 1.5], size: 12 },
		},
		rim: { intensity: 2, position: [-11, -4, -9] },
	} satisfies LightRigConfig,

	/** Fixed orthographic camera (Q7) at the Monument Valley angle: ~35.26° elevation
	 * (atan 1/√2) over a 45° azimuth — the classic isometric, both legs of the L reading
	 * equal on screen. The scene derives the position from angle + target + distance and
	 * refits `orthographicSize` to the viewport on resize. */
	camera: {
		mode: 'orthographic' as const,
		elevationDeg: 35.264,
		azimuthDeg: 45,
		/** Camera distance, u — ortho projection scales nothing, this only feeds near/far. */
		distance: 20,
		/** Look target: the L's bounding-box center, lifted a touch to center cube + sphere. */
		target: [1.95, 0.35, 1.95],
		/** Starting half-extent, u — the resize fit takes over from here. */
		orthographicSize: 3,
		/** Headroom over the fitted content extents. */
		fitMargin: 1.08,
	},
} as const;
