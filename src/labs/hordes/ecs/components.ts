// Components of the horde world (ticket 01). bitecs 0.4 treats any reference as a
// component — identity by reference — and recommends SoA stores: plain number[] grow
// lazily with sparse use, so no capacity management and no thrash for the queries that
// stream them every frame. One world exists at a time; teardown clears the stores.
//
// The player is one entity; its singleton state (lives, timers) lives as SoA fields
// because the fire director, damage and boost systems stream over it with the same
// pattern as every other system — no imperative side door.

/** World-plane position in arena units (x right, z mapped onto y). */
export const Transform = { x: [] as number[], y: [] as number[] };

/** Acceleration—or plain velocity—units/s. Written by input/seek/spawn, streamed by movement. */
export const Velocity = { x: [] as number[], y: [] as number[] };

/** Seconds left until the entity expires (bullets). */
export const Lifetime = { t: [] as number[] };

/** Seconds since spawn; presence marks the enemy class. Drives the seek-speed ramp. */
export const Enemy = { age: [] as number[] };

/** Seconds left in the dying FX state; presence = dying, t counts down to recycle. */
export const Dying = { t: [] as number[] };

/** Index of the pool slot holding the entity's Mesh3D. */
export const Slot = { i: [] as number[] };

/** The one player entity, with its singleton gameplay state as SoA fields. */
export const Player = {
	lives: [] as number[],
	fireTimer: [] as number[],
	invulnTimer: [] as number[],
	boostTimer: [] as number[],
	/** Seconds the hurt flash keeps tinting the player's own material. */
	hurtTimer: [] as number[],
};

/** Marker: an in-flight bullet. */
export const Bullet: Record<never, never> = {};

/** Marker: a live pickup. */
export const Pickup: Record<never, never> = {};

/**
 * Every SoA store in this module, for the teardown sweep that zeroes array lengths —
 * the same world builder runs again on game-over restart, and stale lengths would
 * resurrect ghost entities.
 */
export const COMPONENT_STORES = [Transform, Velocity, Lifetime, Enemy, Dying, Slot] as const;
