// Lab 01 — hello-cube (ticket 05): the beta's smallest honest scene on the shell.
// All scene constants live in ./config; this file only assembles the scene graph.
import { Material3D, Mesh3D } from '@pixi/3d';
import { createView3D } from '../core/world';
import { addLightRig } from '../core/theme';
import type { LabContext, LabScene } from '../core/shell';
import { createRoundedBoxGeometry } from '../core/geometry/rounded-box';
import { HELLO_CUBE } from './config';

export function createHelloCubeScene(): LabScene {
	let ctx: LabContext | null = null;
	let cube: Mesh3D | null = null;

	return {
		setup(context) {
			ctx = context;

			const view = createView3D(context.app);
			addLightRig(view.root, HELLO_CUBE.lights);

			cube = new Mesh3D({
				geometry: createRoundedBoxGeometry(HELLO_CUBE.cube.geometry),
				material: new Material3D(HELLO_CUBE.cube.material),
			});
			view.root.addChild(cube);

			view.camera.position.set(...HELLO_CUBE.camera.position);
			view.camera.lookAt({
				x: HELLO_CUBE.camera.target[0],
				y: HELLO_CUBE.camera.target[1],
				z: HELLO_CUBE.camera.target[2],
			});
		},

		update(ticker) {
			// reduced motion freezes at pose zero — the lab owns what degrades (ticket 05)
			if (!cube || ctx?.reducedMotion || ctx?.static) return;
			cube.rotation.y += HELLO_CUBE.rotationSpeed * (ticker.deltaMS / 1000);
		},

		dispose() {
			cube = null; // the scene graph goes with app.destroy, shell-side
		},
	};
}
