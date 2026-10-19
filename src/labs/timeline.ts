// TimelineSource — the seam the reusable player plays (ticket 09). A timeline is any
// fixed-body-count pose track sampled by time: today a physics recording, tomorrow
// hand-authored keyframes. The player knows nothing beyond this interface.

export interface TimelinePhase {
	/** Phase name for the readout, e.g. `approach`, `impact`, `settled`. */
	name: string;
	/** When the phase starts, in ms. Phases run in order; the last runs to the end. */
	startMs: number;
}

export interface TimelineSource {
	readonly durationMs: number;
	readonly bodyCount: number;
	/** Phases in ascending `startMs`; the first starts at 0. */
	readonly phases: readonly TimelinePhase[];
	/** Sample every body's pose at `tMs` into `out` — `[x, y, z, qx, qy, qz, qw]` per body. */
	sample(tMs: number, out: Float32Array): void;
	/** Phase active at `tMs`. */
	phaseAt(tMs: number): string;
}

export const POSE_FLOATS = 7;

/** Phase name at `tMs` from an ascending phase list. */
export function phaseAt(phases: readonly TimelinePhase[], tMs: number): string {
	let name = phases[0]?.name ?? '';
	for (const phase of phases) {
		if (tMs >= phase.startMs) name = phase.name;
		else break;
	}
	return name;
}

export interface RecordingWriter {
	/** Write one body's pose `[x, y, z, qx, qy, qz, qw]` at `tick`. */
	write(tick: number, body: number, pose: readonly number[]): void;
	/** Finish the recording: freeze the last tick until `holdMs` elapses. */
	finish(holdMs: number): RecordingTimeline;
}

/**
 * A fixed-step pose recording. Poses live in one flat Float32Array, one tick per row;
 * `sample` clamps time and blends between ticks (position lerp, quaternion slerp), so
 * playback is smooth at any frame rate and 100% deterministic.
 */
export class RecordingTimeline implements TimelineSource {
	readonly durationMs: number;
	readonly bodyCount: number;
	readonly phases: readonly TimelinePhase[];
	readonly tickCount: number;
	readonly dtMs: number;
	private readonly data: Float32Array;

	constructor(data: Float32Array, bodyCount: number, dtMs: number, tickCount: number, holdMs: number, phases: readonly TimelinePhase[]) {
		this.data = data;
		this.bodyCount = bodyCount;
		this.dtMs = dtMs;
		this.tickCount = tickCount;
		// the hold extends the loop with the settled poses frozen — no simulation cost,
		// and the progress bar covers the full cycle (ticket 09 Q8)
		this.durationMs = (tickCount - 1) * dtMs + holdMs;
		this.phases = phases;
	}

	sample(tMs: number, out: Float32Array): void {
		const t = Math.max(0, Math.min(this.durationMs, tMs));
		const f = t / this.dtMs;
		const i0 = Math.min(Math.floor(f), this.tickCount - 1);
		const i1 = Math.min(i0 + 1, this.tickCount - 1);
		const a = f - i0;
		const { data, bodyCount } = this;

		for (let b = 0; b < bodyCount; b++) {
			const o0 = (i0 * bodyCount + b) * POSE_FLOATS;
			const o1 = (i1 * bodyCount + b) * POSE_FLOATS;
			const o = b * POSE_FLOATS;
			// position lerp
			for (let k = 0; k < 3; k++) out[o + k] = data[o0 + k] + (data[o1 + k] - data[o0 + k]) * a;
			slerp(data, o0 + 3, data, o1 + 3, a, out, o + 3);
		}
	}

	phaseAt(tMs: number): string {
		return phaseAt(this.phases, tMs);
	}
}

/**
 * Create a recording buffer for a fixed-step bake.
 * @param bodyCount bodies recorded per tick
 * @param dtMs fixed step in ms (the bake's timestep)
 * @param tickCount number of simulated ticks
 */
export function beginRecording(bodyCount: number, dtMs: number, tickCount: number): RecordingWriter {
	const data = new Float32Array(tickCount * bodyCount * POSE_FLOATS);
	return {
		write(tick, body, pose) {
			data.set(pose, (tick * bodyCount + body) * POSE_FLOATS);
		},
		finish(holdMs, phases) {
			return new RecordingTimeline(data, bodyCount, dtMs, tickCount, holdMs, phases);
		},
	};
}

/** Quaternion slerp, reading `a`/`b` from flat arrays and writing `t`-blended into `out`. */
export function slerp(
	a: Float32Array | number[], ai: number,
	b: Float32Array | number[], bi: number,
	t: number,
	out: Float32Array | number[], oi: number,
): void {
	let ax = a[ai], ay = a[ai + 1], az = a[ai + 2], aw = a[ai + 3];
	const bx = b[bi], by = b[bi + 1], bz = b[bi + 2], bw = b[bi + 3];

	let cos = ax * bx + ay * by + az * bz + aw * bw;
	if (cos < 0) {
		// take the short way around
		cos = -cos;
		ax = -ax; ay = -ay; az = -az; aw = -aw;
	}

	let s0: number, s1: number;
	if (cos > 0.9995) {
		s0 = 1 - t;
		s1 = t; // nearly parallel: lerp is stable, normalization fixes the drift
	} else {
		const theta = Math.acos(cos);
		const sin = Math.sin(theta);
		s0 = Math.sin((1 - t) * theta) / sin;
		s1 = Math.sin(t * theta) / sin;
	}

	const x = s0 * ax + s1 * bx;
	const y = s0 * ay + s1 * by;
	const z = s0 * az + s1 * bz;
	const w = s0 * aw + s1 * bw;
	const len = Math.hypot(x, y, z, w) || 1;
	out[oi] = x / len;
	out[oi + 1] = y / len;
	out[oi + 2] = z / len;
	out[oi + 3] = w / len;
}
