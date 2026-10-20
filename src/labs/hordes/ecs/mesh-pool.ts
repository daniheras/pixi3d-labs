// Preallocated Mesh3D pools (ticket 01): one Mesh3D per slot, shared geometry, and a
// per-entity material instance assigned at pool build time — the dying tint needs to
// rewrite color without stomping shared state, so the material is never shared.
//
// Every slot joins the scene graph once and toggles its lifetime through `visible`: the
// view's scene batch compacts hidden meshes out of its draw lists, so a dead slot costs
// no draw call and no visible-set traversal per frame.
import { Material3D, Mesh3D, type Container3D, type Geometry3D } from '@pixi/3d';

export interface MeshPoolSkin {
	baseColor: number;
	metallic: number;
	roughness: number;
}

export class MeshPool {
	private readonly slots: Mesh3D[] = [];
	private readonly freeSlots: number[] = [];
	private readonly baseColor: number;

	constructor(
		root: Container3D,
		geometry: Geometry3D,
		skin: MeshPoolSkin,
		capacity: number,
		scale: number = 1,
	) {
		this.baseColor = skin.baseColor;
		for (let i = 0; i < capacity; i++) {
			const mesh = new Mesh3D({
				geometry,
				material: new Material3D(skin),
			});
			mesh.visible = false;
			mesh.scale.set(scale, scale, scale);
			root.addChild(mesh);
			this.slots.push(mesh);
			this.freeSlots.push(i);
		}
	}

	/** Take the next free slot; -1 when the pool is exhausted (callers treat it as the cap). */
	acquire(): number {
		const slot = this.freeSlots.pop();
		if (slot === undefined) return -1;
		this.slots[slot].visible = true;
		return slot;
	}

	/**
	 * Hand a busy slot back: reset the per-entity material tint (the flash state could be
	 * mid-flight) and hide the mesh again.
	 */
	release(slot: number): void {
		const mesh = this.slots[slot];
		if (mesh.material) mesh.material.baseColor = this.baseColor;
		mesh.visible = false;
		this.freeSlots.push(slot);
	}

	/** Pool size the render sync and diag paths may want directly. */
	get capacity(): number {
		return this.slots.length;
	}

	/** Pool pressure for the HUD's honest live counts. */
	get freeCount(): number {
		return this.freeSlots.length;
	}

	getMesh(slot: number): Mesh3D {
		return this.slots[slot];
	}
}
