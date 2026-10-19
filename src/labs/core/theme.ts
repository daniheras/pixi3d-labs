// Shared theme: the house palette and a repeatable light rig. Both labs hang the same
// warm key / red rim / warm ambient setup at different scales — express it once as data
// and let each lab's config own the numbers.
import { AmbientLight, type Container3D, DirectionalLight } from '@pixi/3d';

/** The lab palette (ADR 0001): ink void, Signal Red accent, cream neutrals. */
export const PALETTE = {
	/** Environment / UI ink. */
	ink: {
		sky: 0x2a1f1a,
		ground: 0x0b0908,
	},
	/** Signal Red — the accent; the only red object in a scene. */
	red: 0xe5483c,
	/** Hover-bright red (the UI's hot variant of Signal Red). */
	redBright: 0xff5f4d,
	/** Cream — warm neutrals, e.g. voxel walls and copy. */
	cream: 0xd8cfc7,
	/** Warm light tints for the rig. */
	lightWarm: 0xffd8c0,
	lightKey: 0xfff4e0,
} as const;

export interface LightRigConfig {
	/** Three-way light rig: warm ambient, warm key, red rim. */
	ambient: {
		/** Color tint. @default PALETTE.lightWarm */
		color?: number;
		intensity: number;
	};
	key: { color?: number; intensity: number; position: [number, number, number] };
	rim: { color?: number; intensity: number; position: [number, number, number] };
}

/**
 * Add the standard three-way rig to a view root: warm ambient fill, warm key, red rim —
 * all aimed at the origin. Colors default to the house tints; lab configs own the
 * intensities and poses.
 */
export function addLightRig(root: Container3D, rig: LightRigConfig): void {
	root.addChild(
		new AmbientLight({ color: rig.ambient.color ?? PALETTE.lightWarm, intensity: rig.ambient.intensity }),
	);

	const key = new DirectionalLight({ color: rig.key.color ?? PALETTE.lightKey, intensity: rig.key.intensity });
	key.position.set(...rig.key.position);
	key.lookAt({ x: 0, y: 0, z: 0 });
	root.addChild(key);

	const rim = new DirectionalLight({ color: rig.rim.color ?? PALETTE.red, intensity: rig.rim.intensity });
	rim.position.set(...rig.rim.position);
	rim.lookAt({ x: 0, y: 0, z: 0 });
	root.addChild(rim);
}
