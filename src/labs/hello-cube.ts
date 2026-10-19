// Lab 01 — hello-cube (ticket 05): the beta's smallest honest scene on the shell.
import { AmbientLight, DirectionalLight, Material3D, Mesh3D } from '@pixi/3d';
import { createView3D, type LabContext, type LabScene } from './shell';
import { createRoundedBoxGeometry } from './geometry';

export function createHelloCubeScene(): LabScene {
	let ctx: LabContext | null = null;
	let cube: Mesh3D | null = null;

	return {
		setup(context) {
			ctx = context;

			const view = createView3D(context.app);

			view.root.addChild(new AmbientLight({ color: 0xffd8c0, intensity: 0.35 }));

			const keyLight = new DirectionalLight({ color: 0xfff4e0, intensity: 4 });
			keyLight.position.set(4, 5, 6);
			keyLight.lookAt({ x: 0, y: 0, z: 0 });
			view.root.addChild(keyLight);

			const rimLight = new DirectionalLight({ color: 0xe5483c, intensity: 2 });
			rimLight.position.set(-5, -2, -4);
			rimLight.lookAt({ x: 0, y: 0, z: 0 });
			view.root.addChild(rimLight);

			cube = new Mesh3D({
				geometry: createRoundedBoxGeometry({ size: 1, radius: 0.1, segments: 12 }),
				material: new Material3D({ baseColor: 0xe5483c, metallic: 0.05, roughness: 0.35 }),
			});
			view.root.addChild(cube);

			view.camera.position.set(2.2, 1.8, 3.2);
			view.camera.lookAt({ x: 0, y: 0, z: 0 });
		},

		update(ticker) {
			// reduced motion freezes at pose zero — the lab owns what degrades (ticket 05)
			if (!cube || ctx?.reducedMotion || ctx?.static) return;
			cube.rotation.y += 0.5 * (ticker.deltaMS / 1000);
		},

		dispose() {
			cube = null; // the scene graph goes with app.destroy, shell-side
		},
	};
}
