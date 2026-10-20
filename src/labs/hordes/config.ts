// hordes config (ticket 01): everything about the lab that isn't wiring — all gameplay
// and render constants as typed data. The tuning table in .scratch/hordes/spec.md is
// the contract; this file owns the decimals. Implementation reads these, never its own
// magic numbers.
import { PALETTE, type LightRigConfig } from '../core/theme';

/** The pickups' yellow: the user spec demands yellow spheres and the palette has none. */
const pickupYellow = 0xffd73f;

export const HORDES = {
	/** Bounded square arena: the player and pickups stay inside, enemies spawn just outside. */
	arena: {
		/** Half-extent per axis, units → an 80×80 square. */
		half: 40,
		/** Spawn a few units outside the wall (instant, no entrance animation per spec). */
		edgeOutset: 2,
	},
	cap: {
		/** Hard cap on alive enemies: the surplus recycles the oldest, no FX (spec). */
		enemies: 2000,
		/** Hard cap on alive bullets; the pool never grows past it. */
		bullets: 400,
	},
	player: {
		geometry: { radius: 1, widthSegments: 16, heightSegments: 8 },
		material: { baseColor: PALETTE.red, metallic: 0.05, roughness: 0.35 },
		speed: 9,
		lives: 5,
		/** Invulnerability window after a hit, seconds. */
		invuln: 1,
		/** Seconds between shots while no boost is active. */
		fireInterval: 0.4,
		/** Fire only if the nearest enemy is closer than this, units. */
		fireThreshold: 16,
	},
	enemy: {
		geometry: { size: 0.7, radius: 0.07, segments: 4 },
		material: { baseColor: PALETTE.cream, metallic: 0.05, roughness: 0.35 },
		/** Fresh enemies start here and ramp linearly to `speedMax`. */
		speedStart: 2.5,
		speedMax: 4.5,
		/** Seconds from spawn until a fresh enemy reaches `speedMax`. */
		speedRamp: 60,
	},
	spawn: {
		/** Seconds between spawn batches. */
		interval: 0.8,
		/** Enemies per batch at the start. */
		batch: 4,
		/** Seconds per +enemy in every batch; a ramp that never ends. */
		ramp: 20,
	},
	bullet: {
		geometry: { radius: 0.35, widthSegments: 8, heightSegments: 6 },
		material: { baseColor: PALETTE.cream, metallic: 0, roughness: 0.25 },
		speed: 26,
		/** Seconds alive, then expire if the shot never landed. */
		lifetime: 2,
	},
	pickup: {
		geometry: { radius: 0.6, widthSegments: 12, heightSegments: 8 },
		material: { baseColor: pickupYellow, metallic: 0.1, roughness: 0.2 },
		/** Seconds between pickup spawn rolls. */
		interval: 10,
		maxAlive: 2,
	},
	/** Fire-rate boost granted by a pickup grab: an 8-way radial volley per shot. */
	boost: { spokes: 8, seconds: 6 },
	/** The one-hit death FX: flash + render-side shake; ECS physics untouched. */
	death: {
		/** Dying state duration, seconds. */
		dying: 0.15,
		/** The flash color it tints the enemy's own material to while dying. */
		flashColor: 0xffffff,
		/** Amplitude of the dying positional jitter. */
		shake: 0.1,
	},
	/** The hurt player's material flash color. */
	hurt: { flashColor: PALETTE.redBright },
	/** Collision data: spatial hash cell + squared-distance collision radii. */
	collision: {
		/** Grid cell edge, units; rebuilt every frame from the Transform tables. */
		cell: 4,
		/** Hit radii: enemies ~half the 0.7 cube +fudge, bullets their sphere. */
		enemyRadius: 0.4,
		bulletRadius: 0.35,
		/** The body radius for enemy→player overlap checks. */
		playerRadius: 1,
		/** Pickup grab radius (the pickup sphere itself). */
		pickupRadius: 0.6,
	},
	/** World-plane y maps to view-space z; this table is each class's height above the ground. */
	height: { player: 1.4, enemy: 0.5, bullet: 0.55, pickup: 0.85 },
	/**
	 * Mesh-only visual scales — the view reads better with bigger shapes and the
	 * collision radii stay as tuned above (visuals slightly generous, physics honest).
	 */
	visual: { player: 1.4, enemy: 1.4, bullet: 1.5, pickup: 1.4 },
	/** ?static seeding — the capture frame shows a mid-horde instead of an empty arena. */
	static: { enemies: 300, bullets: 24, pickups: 1 },
	camera: {
		mode: 'orthographic' as const,
		/** Half the view width in world units; the stage is wide, so the whole 80u arena fits. */
		orthographicSize: 55,
		position: [0, 95, 40],
		target: [0, 0, 0],
	},
	/** House rig, scaled out to the 80×80 arena — same three-way, bigger arms. */
	lights: {
		ambient: { intensity: 0.9 },
		key: { intensity: 5, position: [50, 70, 80] },
		rim: { intensity: 2.5, position: [-60, -25, -70] },
	} satisfies LightRigConfig,
	hud: { refreshHz: 4 },
} as const;
