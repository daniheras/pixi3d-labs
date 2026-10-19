// Reusable geometry helpers for @pixi/3d, at core/geometry (home settled by ticket 04 /
// ADR 0001; indexed here as the shared construction set).
//
// A rounded box: CubeGeometry has hard edges and no radius option, so build the
// classic subdivided-cube-rounded-to-a-shell by hand: clamp each grid vertex to
// the inner box, then push it out along the corner direction; the normalized
// offset is the exact smooth normal.
import { Geometry3D } from '@pixi/3d';

export interface RoundedBoxOptions {
	/** Full edge length of the box. @default 1 */
	size?: number;
	/** Corner/edge rounding radius; clamped to size/2. @default 0.1 */
	radius?: number;
	/** Grid subdivisions per face; more = smoother rounding band. @default 10 */
	segments?: number;
}

export function createRoundedBoxGeometry(options: RoundedBoxOptions = {}): Geometry3D {
	const size = options.size ?? 1;
	const radius = Math.min(options.radius ?? 0.1, size / 2);
	const n = Math.max(1, Math.floor(options.segments ?? 10));

	const inner = size / 2 - radius;

	// six faces: [origin corner, u axis, v axis], with u × v pointing outward
	const faces: [number[], number[], number[]][] = [
		[[-1, -1, 1], [1, 0, 0], [0, 1, 0]], // +Z
		[[1, -1, -1], [-1, 0, 0], [0, 1, 0]], // -Z
		[[1, -1, 1], [0, 0, -1], [0, 1, 0]], // +X
		[[-1, -1, -1], [0, 0, 1], [0, 1, 0]], // -X
		[[-1, 1, 1], [1, 0, 0], [0, 0, -1]], // +Y
		[[-1, -1, -1], [1, 0, 0], [0, 0, 1]], // -Y
	];

	const grid = (n + 1) * (n + 1);
	const vertexCount = grid * faces.length;
	const positions = new Float32Array(vertexCount * 3);
	const normals = new Float32Array(vertexCount * 3);
	const uvs = new Float32Array(vertexCount * 2);
	const indices = new Uint16Array(n * n * 6 * faces.length);

	let v = 0;
	let uv = 0;
	let idx = 0;
	let base = 0;

	for (const [origin, u, axv] of faces) {
		for (let iy = 0; iy <= n; iy++) {
			for (let ix = 0; ix <= n; ix++) {
				// face-space corner on the un-rounded cube, in [-size/2, size/2];
				// u/v span the full edge (2 units in ±1 space), not just one
				const px = (origin[0] + 2 * u[0] * (ix / n) + 2 * axv[0] * (iy / n)) * (size / 2);
				const py = (origin[1] + 2 * u[1] * (ix / n) + 2 * axv[1] * (iy / n)) * (size / 2);
				const pz = (origin[2] + 2 * u[2] * (ix / n) + 2 * axv[2] * (iy / n)) * (size / 2);

				// offset from the inner box: nonzero only along the face axis (edges/corners: more)
				const dx = px - Math.max(-inner, Math.min(inner, px));
				const dy = py - Math.max(-inner, Math.min(inner, py));
				const dz = pz - Math.max(-inner, Math.min(inner, pz));
				const len = Math.hypot(dx, dy, dz); // the face axis guarantees len ≥ radius > 0

				positions[v] = px - dx + (dx / len) * radius;
				positions[v + 1] = py - dy + (dy / len) * radius;
				positions[v + 2] = pz - dz + (dz / len) * radius;
				normals[v] = dx / len;
				normals[v + 1] = dy / len;
				normals[v + 2] = dz / len;
				uvs[uv] = ix / n;
				uvs[uv + 1] = iy / n;
				v += 3;
				uv += 2;
			}
		}

		// CCW from outside: a bottom-left, d bottom-right, c top-right, b top-left
		for (let iy = 0; iy < n; iy++) {
			for (let ix = 0; ix < n; ix++) {
				const a = base + iy * (n + 1) + ix;
				const b = base + (iy + 1) * (n + 1) + ix;
				const c = base + (iy + 1) * (n + 1) + ix + 1;
				const d = base + iy * (n + 1) + ix + 1;
				indices[idx++] = a;
				indices[idx++] = d;
				indices[idx++] = c;
				indices[idx++] = a;
				indices[idx++] = c;
				indices[idx++] = b;
			}
		}
		base += grid;
	}

	return new Geometry3D({ positions, normals, uvs, indices });
}
