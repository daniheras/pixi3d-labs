// Spatial hash grid (ticket 02): the collision substrate for both queries the spec
// names (bullet→enemy, enemy→player) and the fire director's nearest-enemy threshold.
// Rebuilt every frame from the Transform tables; cells are reused across frames —
// the clear() empties only the lists that were filled last build, so the map stops
// growing in steady state and nothing allocates per rebuild.
//
// Squared distances only: every consumer works with hit radii and no sqrt call.
import { query } from 'bitecs';
import { Transform } from '../components';
import type { HordeBundle } from '../world';

export class SpatialHash {
	/** The one grid; cell indices are world-space / cell, so racing bounds over ±2k units map safely. */
	private readonly cells = new Map<number, number[]>();
	/** Cells filled by the last build, for the O(cells-used) clear. */
	private readonly touched: number[][] = [];
	private readonly cell: number;

	constructor(cell: number) {
		this.cell = cell;
	}

	/** Empties every cell the last build touched; map keys survive to be reused. */
	clear(): void {
		for (const list of this.touched) list.length = 0;
		this.touched.length = 0;
	}

	insert(x: number, y: number, eid: number): void {
		const ix = Math.floor(x / this.cell);
		const iy = Math.floor(y / this.cell);
		const key = (iy + 2048) * 4096 + (ix + 2048);
		let list = this.cells.get(key);
		if (!list) {
			list = [];
			this.cells.set(key, list);
		}
		if (list.length === 0) this.touched.push(list);
		list.push(eid);
	}

	/** Visits every non-empty cell overlapping the world-space box, closed bounds. */
	box(
		minX: number,
		minY: number,
		maxX: number,
		maxY: number,
		visit: (eids: number[]) => void,
	): void {
		const ixMin = Math.floor(minX / this.cell);
		const ixMax = Math.floor(maxX / this.cell);
		const iyMin = Math.floor(minY / this.cell);
		const iyMax = Math.floor(maxY / this.cell);
		for (let iy = iyMin; iy <= iyMax; iy++) {
			const row = (iy + 2048) * 4096;
			for (let ix = ixMin; ix <= ixMax; ix++) {
				const list = this.cells.get(row + ix + 2048);
				if (list && list.length > 0) visit(list);
			}
		}
	}
}

/** Rebuild the bundle's grid from scratch: Transform is the one universal index. */
export function rebuildGrid(bundle: HordeBundle): void {
	bundle.grid.clear();
	const grid = bundle.grid;
	for (const eid of query(bundle.ecs, [Transform])) {
		grid.insert(Transform.x[eid], Transform.y[eid], eid);
	}
}
