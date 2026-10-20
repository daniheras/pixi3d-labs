// Deterministic RNG for the horde world (ticket 01): mulberry32 — 2^32 of state, small
// enough to seed from `?static`'s fixed seed and fast enough for the spawn director's
// per-batch rolls.
export type Rng = () => number;

export function createRng(seed: number): Rng {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
