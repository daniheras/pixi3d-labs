// Lab 03 — ak47: the first lab fed by a real asset. The source FBX carries no UVs and
// its two "textures" are solid color swatches (AK47(1).png #464646 gunmetal,
// AK47(2).png #ac7e3f wood), so the conversion bakes each swatch into its material's
// baseColor (sRGB → linear), authors the PBR per part (full-metal tight specular for
// the receiver, dielectric + clearcoat varnish for the wood) and strips the
// authoring-space offset, leaving the model centered at the origin at ~10 × 2.8 × 0.5
// units.
//
// The staging: a bare bulb hanging over the gun, failing like an old filament — an
// invisible warm point light whose intensity follows a deterministic noise pattern
// (slow base wander, fast shallow grain, occasional collapse). Reduced motion and
// ?static hold the filament steady; ?t=<ms> freezes any flicker instant for
// deterministic captures.
//
// The interaction: a turntable drag (horizontal travel yaws the gun) and hover reveals —
// the asset carries a baked back-face shell inflated along position-smoothed normals in
// bone white, and the view's raycast picks the gun per triangle. Both the shell and the
// part labels show while the pointer is over the gun, and both stay on for the whole
// drag even when the pointer leaves the silhouette.
import { Container3D, loadGlb, Mesh3D, Model3D, PointLight, type Event3DFields, type View3D } from '@pixi/3d';
import { createView3D } from '../core/world';
import { addLightRig } from '../core/theme';
import type { LabContext, LabScene } from '../core/shell';
import { AK47 } from './config';

/** Deterministic hash noise — every visit to the same input replays the same value. */
function hash1(n: number): number {
	const s = Math.sin(n * 127.1) * 43758.5453;
	return s - Math.floor(s);
}

/** Smooth value noise in [0, 1]. */
function noise1(x: number): number {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return hash1(i) * (1 - u) + hash1(i + 1) * u;
}

export function createAk47Scene(): LabScene {
	let ctx: LabContext | null = null;
	let bulb: PointLight | null = null;
	let view: View3D | null = null;
	/** The SVG leader layer over the canvas, torn down with the scene. */
	let overlay: HTMLDivElement | null = null;
	/** One record per callout: the 3D anchor on the gun and its 2D leader + dot. */
	let callouts: { node: Container3D; line: SVGLineElement; dot: SVGCircleElement; fx: number; fy: number }[] = [];
	let timeMs = 0;
	/** Frozen clock when ?t=<ms> is set; the update hook stops advancing. */
	let frozenTimeMs: number | null = null;

	/** The failure pattern in [floor, 1] for a time in seconds. */
	function flickerLevel(t: number): number {
		const F = AK47.bulb.flicker;
		const wander = noise1(t * F.wanderHz + 11.3);
		const flutter = noise1(t * F.flutterHz + 37.7);
		const gate = noise1(t * F.gateHz + 53.1);
		const collapse = gate < 0.14 ? Math.max(gate / 0.14, F.floor) : 1;
		return Math.max(F.floor, (0.62 + 0.38 * wander) * (0.78 + 0.22 * flutter) * collapse);
	}

	/** Drive the light from one level. */
	function apply(level: number): void {
		if (!bulb) return;
		bulb.intensity = AK47.bulb.intensity * level;
	}

	return {
		async setup(context) {
			ctx = context;

			view = createView3D(context.app, AK47.environment);
			addLightRig(view.root, AK47.lights);

			// loaded fresh per arrival, bypassing the Assets cache: the shell destroys the
			// app on every departure, and a cached source would outlive its GPU resources
			const source = await loadGlb.load(AK47.model.url);
			const model = new Model3D(source);
			view.root.addChild(model);

			// turntable drag: horizontal pointer travel yaws the gun around its own vertical
			// axis; vertical travel is ignored, so the gun stays horizontal however the
			// visitor drags. Direct 1:1 manipulation — allowed under reduced motion, and the
			// only pose change in the scene. Skipped in ?static, whose one frame must stay
			// reproducible. The canvas is destroyed with the app on every departure, and the
			// listeners die with it; the next setup binds a fresh set to the fresh canvas.
			//
			// The pointer state feeds the reveals (below): the outline AND the labels stay
			// on for a whole drag — fast travel outruns the raycast or carries the pointer
			// off the gun, and a flicker mid-turn reads as a bug — and otherwise track the
			// hover. Touch has no hover: a tap on the gun pins the reveals until a tap
			// elsewhere (or on the gun again) clears them, and a drag never toggles.
			const canvas = context.app.canvas;
			let dragging = false;
			let hovered = false;
			let pinned = false;
			let shell: Container3D | null = null;
			const syncReveals = (): void => {
				const on = dragging || hovered || pinned;
				if (shell) shell.visible = on;
				overlay?.classList.toggle('visible', on);
			};

			let lastX = 0;
			let lastY = 0;
			let travel = 0;
			const onDown = (e: PointerEvent) => {
				dragging = true;
				travel = 0;
				lastX = e.clientX;
				lastY = e.clientY;
				canvas.style.cursor = 'grabbing';
				canvas.setPointerCapture(e.pointerId);
				syncReveals();
			};
			const onMove = (e: PointerEvent) => {
				if (!dragging) return;
				// horizontal travel yaws; vertical travel is ignored for the pose but still
				// counts toward the tap-vs-drag radius
				travel += Math.hypot(e.clientX - lastX, e.clientY - lastY);
				model.rotation.y += (e.clientX - lastX) * AK47.drag.radiansPerPixel;
				lastX = e.clientX;
				lastY = e.clientY;
			};
			const onUp = () => {
				dragging = false;
				canvas.style.cursor = 'grab';
				syncReveals();
			};

			if (!context.static) {
				canvas.style.cursor = 'grab';
				canvas.addEventListener('pointerdown', onDown);
				canvas.addEventListener('pointermove', onMove);
				canvas.addEventListener('pointerup', onUp);
				canvas.addEventListener('pointercancel', onUp);
			}

			// the bulb: the light itself — the source stays invisible, only its light shows
			bulb = new PointLight({
				color: AK47.bulb.color,
				intensity: AK47.bulb.intensity,
				range: AK47.bulb.range,
			});
			bulb.position.set(...AK47.bulb.position);
			view.root.addChild(bulb);

			// the hover outline: hidden until the pointer is over the gun (or a drag is
			// live), and never itself pickable — its halo must not swallow the hover it
			// announces
			const found = model.getChildByLabel(AK47.outline.label, true);
			if (!found) throw new Error('outline shell missing from the asset');
			shell = found;
			shell.eventMode = 'none';
			syncReveals();

			// per-triangle picking on the gun's meshes; the view-level move listener reads
			// the hit target, so moving between the gun's parts can't flicker the reveals
			const pickables: Container3D[] = [];
			const collect = (node: Container3D): void => {
				if (node !== shell && node instanceof Mesh3D) pickables.push(node);
				for (const child of node.children) collect(child);
			};
			collect(model);
			for (const mesh of pickables) {
				mesh.eventMode = 'static';
				mesh.hitVolume = 'geometry';
			}
			view.on('pointermove', (e) => {
				// touch has no hover — its reveal is the tap pin below
				hovered = e.pointerType !== 'touch' && (e as unknown as Event3DFields).target3D !== null;
				syncReveals();
			});
			view.on('pointerleave', () => {
				hovered = false;
				syncReveals();
			});

			// the touch reveal: a tap on the gun toggles the pin, a tap elsewhere clears it,
			// and a drag never toggles (travel beyond the tap radius is a rotation, not a tap)
			const TAP_TRAVEL_PX = 8;
			view.on('pointertap', (e) => {
				if (e.pointerType === 'mouse') return; // desktop keeps pure hover
				if (travel > TAP_TRAVEL_PX) return;
				pinned = (e as unknown as Event3DFields).target3D !== null ? !pinned : false;
				syncReveals();
			});

			view.camera.position.set(...AK47.camera.position);
			view.camera.lookAt({
				x: AK47.camera.target[0],
				y: AK47.camera.target[1],
				z: AK47.camera.target[2],
			});

			// the callout overlay: static label boxes at stage slots, an SVG layer under
			// them for the leaders. Each anchor is a child of the model at its part, so
			// the drag rotation carries it; the leader's far end tracks the anchor's
			// projection every frame (?static's single update covers captures).
			//
			// The reveal runs only while the pointer is over the gun: labels enter
			// staggered 55ms apart (each label first, its leader 60ms behind — the name,
			// then the connection), all leave together, faster and undelayed. The curve is
			// the site's own ease-out; reduced motion keeps the fade and drops the travel.
			overlay = document.createElement('div');
			overlay.dataset.labLabels = '';
			overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;'; // never eats input — the drag lives on the canvas
			const style = document.createElement('style');
			style.textContent = `
				[data-lab-labels] .label {
					position: absolute;
					opacity: 0;
					transform: translate(-50%, calc(-50% + 6px));
					transition: opacity 110ms ease, transform 110ms ease;
					padding: 2px 9px;
					font-size: 12px;
					letter-spacing: 0.04em;
					color: #d8cfc7;
					background: rgba(11, 9, 8, 0.78);
					border: 1px solid rgba(216, 207, 199, 0.28);
					white-space: nowrap;
				}
				[data-lab-labels].visible .label {
					opacity: 1;
					transform: translate(-50%, -50%);
					transition: opacity 160ms cubic-bezier(0.23, 1, 0.32, 1) var(--stagger, 0ms),
						transform 160ms cubic-bezier(0.23, 1, 0.32, 1) var(--stagger, 0ms);
				}
				[data-lab-labels] .leader,
				[data-lab-labels] .anchor {
					opacity: 0;
					transition: opacity 100ms ease;
				}
				[data-lab-labels].visible .leader,
				[data-lab-labels].visible .anchor {
					opacity: 1;
					transition: opacity 140ms ease-out calc(var(--stagger, 0ms) + 60ms);
				}
				@media (prefers-reduced-motion: reduce) {
					[data-lab-labels] .label {
						transform: translate(-50%, -50%);
						transition: opacity 120ms ease var(--stagger, 0ms);
					}
				}
			`;
			overlay.appendChild(style);
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
			svg.setAttribute('width', '100%');
			svg.setAttribute('height', '100%');
			svg.style.cssText = 'position:absolute;inset:0;';
			overlay.appendChild(svg);
			callouts = AK47.labels.parts.map((part, i) => {
				const stagger = `${i * 55}ms`;
				const node = new Container3D();
				node.position.set(...part.at);
				model.addChild(node);

				const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
				line.setAttribute('class', 'leader');
				line.setAttribute('stroke', 'rgba(216, 207, 199, 0.55)');
				line.setAttribute('stroke-width', '1');
				line.style.setProperty('--stagger', stagger);
				const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
				dot.setAttribute('class', 'anchor');
				dot.setAttribute('r', '2.5');
				dot.setAttribute('fill', '#d8cfc7');
				dot.style.setProperty('--stagger', stagger);
				svg.appendChild(line);
				svg.appendChild(dot);

				// the box paints over its leader's start, so the line reads as ending at
				// the label's edge without any edge math
				const box = document.createElement('div');
				box.className = 'label';
				box.textContent = part.label;
				box.style.setProperty('--stagger', stagger);
				box.style.left = `${part.slot[0] * 100}%`;
				box.style.top = `${part.slot[1] * 100}%`;
				overlay.appendChild(box);
				return { node, line, dot, fx: part.slot[0], fy: part.slot[1] };
			});
			ctx.host.appendChild(overlay);
			// ?static's capture frame shows the settled reveal — deterministic
			if (context.static) overlay.classList.add('visible');

			// dev/capture affordance: ?t=<ms> freezes the flicker at that instant
			const tParam = new URLSearchParams(location.search).get('t');
			frozenTimeMs = tParam === null ? null : Number(tParam) || 0;
			timeMs = frozenTimeMs ?? 0;
		},

		update(ticker) {
			if (!ctx) return;
			if (frozenTimeMs !== null) {
				apply(flickerLevel(frozenTimeMs / 1000));
			} else if (ctx.reducedMotion || ctx.static) {
				apply(AK47.bulb.flicker.steadyLevel);
			} else {
				timeMs += ticker.deltaMS;
				apply(flickerLevel(timeMs / 1000));
			}

			// the leaders track the parts: label end sits at its stage slot, anchor end at
			// the anchor's projection (null hides the pair — nothing behind the camera)
			if (!view || !overlay) return;
			const w = ctx.host.clientWidth;
			const h = ctx.host.clientHeight;
			for (const c of callouts) {
				const p = view.worldToScreen(c.node.getGlobalPosition());
				const visible = p !== null;
				c.line.setAttribute('visibility', visible ? 'visible' : 'hidden');
				c.dot.setAttribute('visibility', visible ? 'visible' : 'hidden');
				if (!p) continue;
				c.line.setAttribute('x1', String(c.fx * w));
				c.line.setAttribute('y1', String(c.fy * h));
				c.line.setAttribute('x2', String(p.x));
				c.line.setAttribute('y2', String(p.y));
				c.dot.setAttribute('cx', String(p.x));
				c.dot.setAttribute('cy', String(p.y));
			}
		},

		dispose() {
			bulb = null; // the scene graph goes with app.destroy, shell-side
			view = null;
			overlay?.remove();
			overlay = null;
			callouts = [];
			ctx = null;
		},
	};
}
