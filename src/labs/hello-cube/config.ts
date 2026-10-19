// hello-cube config (ticket 05): everything about the lab that isn't wiring — cube shape,
// motion, materials, light rig poses, camera. Implementation owns the decimals.
import { PALETTE, type LightRigConfig } from '../core/theme';

export const HELLO_CUBE = {
	/** The rounded cube: geometry + the Signal Red skin (ADR 0001 — the one red accent). */
	cube: {
		geometry: { size: 1, radius: 0.1, segments: 12 },
		material: { baseColor: PALETTE.red, metallic: 0.05, roughness: 0.35 },
	},
	/** Spin rate, rad/s; reduced motion and ?static freeze at pose zero. */
	rotationSpeed: 0.5,
	/** House three-way rig at scene scale, key/rim aimed at the cube. */
	lights: {
		ambient: { intensity: 0.35 },
		key: { intensity: 4, position: [4, 5, 6] },
		rim: { intensity: 2, position: [-5, -2, -4] },
	} satisfies LightRigConfig,
	/** Fixed camera: 3/4 view from slightly above. */
	camera: {
		position: [2.2, 1.8, 3.2],
		target: [0, 0, 0],
	},
} as const;
