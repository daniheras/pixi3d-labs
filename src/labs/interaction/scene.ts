// Lab 04 — interaction (spec in .scratch/interaction/spec.md): a red sphere hops along an L
// of floating cream cubes, Monument Valley style, under a fixed orthographic camera. Click a
// cube and the sphere hops cube to cube along the chain; clicking again mid-journey finishes
// the hop in flight and re-plans toward the new target.
//
// Motion is procedural per frame (spec Q9): a tiny state machine — rest ↔ hop, plus a scale
// settle riding independently — and the journey is modeled as nothing but `target` + the
// current chain index. The next step (±1 along the chain) is decided when each hop lands,
// which makes interruption (spec Q5c) free: a mid-flight click only rewrites `target`.
// All numbers live in ./config.
import { Material3D, Mesh3D, SphereGeometry, type Event3DFields, type View3D } from '@pixi/3d';
import { createView3D } from '../core/world';
import { addLightRig, PALETTE } from '../core/theme';
import type { LabContext, LabScene } from '../core/shell';
import { createRoundedBoxGeometry } from '../core/geometry/rounded-box';
import { INTERACTION, PATH_LENGTH, PATH_SPACING } from './config';

const HOP = INTERACTION.hop;
const HOVER = INTERACTION.hover;
const PULSE = INTERACTION.tapPulse;
const CAM = INTERACTION.camera;
const CUBE_HALF = INTERACTION.path.cubeSize / 2;
const SPHERE_R = INTERACTION.sphereGeometry.radius;
/** Sphere center height while resting on a cube: cube top plus radius. */
const REST_Y = INTERACTION.path.height + CUBE_HALF + SPHERE_R;

/** Chain grid positions: leg 1 runs +x out of the corner at the origin, leg 2 runs +z out.
 * Both legs opening toward +x/+z is what makes the L read at a 45° azimuth — a leg running
 * −x would project onto the leg-2 diagonal and collapse the L into a line on screen. */
function cubeCenter(i: number): { x: number; y: number; z: number } {
	const leg = INTERACTION.path.leg;
	if (i < leg) return { x: (leg - 1 - i) * PATH_SPACING, y: INTERACTION.path.height, z: 0 };
	return { x: 0, y: INTERACTION.path.height, z: (i - leg + 1) * PATH_SPACING };
}

/** Strong ease-out, config exponent: progress = 1 − (1 − t)^n — fast launch, soft arrival. */
function easeOut(t: number, n: number): number {
	return 1 - Math.pow(1 - t, n);
}

/** Tap-pulse level in [0, 1] for the selected cube: fast attack, brief hold, release that
 * exits fast and lands soft (exit faster than enter — the selection must read at once). */
function pulseLevel(t: number): number {
	if (t <= PULSE.attackMs) return t / PULSE.attackMs;
	if (t <= PULSE.attackMs + PULSE.holdMs) return 1;
	const u = Math.min((t - PULSE.attackMs - PULSE.holdMs) / PULSE.releaseMs, 1);
	return 1 - easeOut(u, 2);
}

/** Linear-space rgb mix for the hover tint (hex colors in, hex color out). */
function mixColor(a: number, b: number, k: number): number {
	const r = Math.round((((a >> 16) & 0xff) * (1 - k) + ((b >> 16) & 0xff) * k));
	const g = Math.round((((a >> 8) & 0xff) * (1 - k) + ((b >> 8) & 0xff) * k));
	const bl = Math.round(((a & 0xff) * (1 - k) + (b & 0xff) * k));
	return (r << 16) | (g << 8) | bl;
}

export function createInteractionScene(): LabScene {
	let ctx: LabContext | null = null;
	let view: View3D | null = null;
	/** One material per cube — the hover tint is per-cube. */
	let cubeMaterials: Material3D[] = [];
	let cubeByMesh = new Map<Mesh3D, number>();
	let sphere: Mesh3D | null = null;
	/** Refits the ortho size on stage resize; disconnected at dispose. */
	let resizeObserver: ResizeObserver | null = null;

	/** Chain index the sphere last landed on. */
	let at = 0;
	/** Journey objective (spec Q5); null while resting with nowhere to go. */
	let target: number | null = null;
	type Motion = { kind: 'rest' } | { kind: 'hop'; from: number; to: number; t: number };
	let motion: Motion = { kind: 'rest' };
	/** Landing squash recovery (and reduced-motion settle): scale from → 1, riding any motion. */
	let settle: { t: number; from: number } | null = null;

	/** Per-cube hover tint progress in [0, 1]. */
	let hoverIndex: number | null = null;
	const hoverT = new Array<number>(PATH_LENGTH).fill(0);
	/** Last tint level written per cube — skips material writes when nothing moved. */
	const tintK = new Array<number>(PATH_LENGTH).fill(0);
	/** The one tapped cube flashing its selection (touch, no hover); null when idle. */
	let tapPulse: { index: number; t: number } | null = null;

	const beginHop = (): void => {
		if (target === null || target === at) {
			target = null;
			return;
		}
		motion = { kind: 'hop', from: at, to: target > at ? at + 1 : at - 1, t: 0 };
	};

	/** Write the sphere's transform for the current motion + settle state. */
	const applyPose = (): void => {
		if (!sphere) return;
		let x: number, y: number, z: number, sy = 1, sxz = 1;
		if (motion.kind === 'hop') {
			const e = easeOut(motion.t, HOP.exponent);
			const a = cubeCenter(motion.from);
			const b = cubeCenter(motion.to);
			x = a.x + (b.x - a.x) * e;
			z = a.z + (b.z - a.z) * e;
			// physics parabola on the eased progress: quick lift, long soft descent
			y = REST_Y + HOP.arcHeight * 4 * e * (1 - e);
			// vertical-speed proxy, normalized to 1 at launch: |d(4e(1−e))/dt| / max
			const vNorm = Math.abs(1 - 2 * e) * Math.pow(Math.max(1 - motion.t, 0), HOP.exponent - 1);
			sy = 1 + HOP.stretch * vNorm;
			sxz = 1 - (HOP.stretch / 2) * vNorm;
		} else {
			const c = cubeCenter(at);
			x = c.x;
			y = REST_Y;
			z = c.z;
		}
		if (settle) {
			const u = Math.min(settle.t / HOP.settleMs, 1);
			const k = settle.from + (1 - settle.from) * easeOut(u, 3);
			sy *= k;
			sxz *= 1 + (1 - k) * 0.6; // squash conserves the ball's read: flat and wide
		}
		sphere.position.set(x, y, z);
		sphere.scale.set(sxz, sy, sxz);
	};

	return {
		setup(context) {
			ctx = context;

			view = createView3D(context.app);
			addLightRig(view.root, INTERACTION.lights);

			// the path: cream rounded cubes, each with its own material for the hover tint
			const geometry = createRoundedBoxGeometry(INTERACTION.cubeGeometry);
			for (let i = 0; i < PATH_LENGTH; i++) {
				const material = new Material3D({ ...INTERACTION.cubeMaterial });
				const mesh = new Mesh3D({ geometry, material });
				const c = cubeCenter(i);
				mesh.position.set(c.x, c.y, c.z);
				view.root.addChild(mesh);
				cubeMaterials.push(material);
				cubeByMesh.set(mesh, i);
			}

			// the subject — Signal Red, the only red object in the scene (ADR 0001)
			sphere = new Mesh3D({
				geometry: new SphereGeometry(INTERACTION.sphereGeometry),
				material: new Material3D(INTERACTION.sphereMaterial),
			});
			view.root.addChild(sphere);

			// fixed camera (spec Q7): the Monument Valley angle derived from config angles
			const elev = (CAM.elevationDeg * Math.PI) / 180;
			const azim = (CAM.azimuthDeg * Math.PI) / 180;
			const dir = {
				x: Math.cos(elev) * Math.sin(azim),
				y: Math.sin(elev),
				z: Math.cos(elev) * Math.cos(azim),
			};
			view.camera.mode = CAM.mode;
			if (CAM.mode === 'orthographic') view.camera.orthographicSize = CAM.orthographicSize;
			view.camera.position.set(
				CAM.target[0] + dir.x * CAM.distance,
				CAM.target[1] + dir.y * CAM.distance,
				CAM.target[2] + dir.z * CAM.distance,
			);
			view.camera.lookAt({ x: CAM.target[0], y: CAM.target[1], z: CAM.target[2] });

			// responsive framing: ortho size refits to the viewport (ak47's pattern — the
			// camera pose is fixed, only the extents follow the stage box)
			const RIGHT = [Math.cos(azim), 0, -Math.sin(azim)];
			const UP = [-Math.sin(azim) * Math.sin(elev), Math.cos(elev), -Math.cos(azim) * Math.sin(elev)];
			const fit = (): void => {
				if (!view || !ctx) return;
				const w = ctx.host.clientWidth;
				const h = ctx.host.clientHeight;
				if (!w || !h) return;
				let halfW = 0;
				let halfH = 0;
				const push = (p: { x: number; y: number; z: number }): void => {
					const dx = p.x - CAM.target[0];
					const dy = p.y - CAM.target[1];
					const dz = p.z - CAM.target[2];
					halfW = Math.max(halfW, Math.abs(dx * RIGHT[0] + dy * RIGHT[1] + dz * RIGHT[2]));
					halfH = Math.max(halfH, Math.abs(dx * UP[0] + dy * UP[1] + dz * UP[2]));
				};
				for (let i = 0; i < PATH_LENGTH; i++) {
					const c = cubeCenter(i);
					// cube corners...
					for (const ox of [-CUBE_HALF, CUBE_HALF]) {
						for (const oy of [-CUBE_HALF, CUBE_HALF]) {
							for (const oz of [-CUBE_HALF, CUBE_HALF]) {
								push({ x: c.x + ox, y: c.y + oy, z: c.z + oz });
							}
						}
					}
					// ...plus the ball's hop envelope over the cube: rest bottom, arc-peak top
					for (const ox of [-SPHERE_R, SPHERE_R]) {
						for (const oz of [-SPHERE_R, SPHERE_R]) {
							push({ x: c.x + ox, y: REST_Y - SPHERE_R, z: c.z + oz });
							push({ x: c.x + ox, y: REST_Y + HOP.arcHeight + SPHERE_R, z: c.z + oz });
						}
					}
				}
				// ortho size is half the view's width; its height follows from the aspect
				view.camera.orthographicSize = Math.max(halfW, halfH * (w / h)) * CAM.fitMargin;
			};
			fit();
			resizeObserver = new ResizeObserver(fit);
			resizeObserver.observe(context.host);

			// picking (ak47's precedent): geometry-exact hits on the cubes, view-level
			// listeners read the hit target. Skipped in ?static — its one frame must stay
			// reproducible, and its capture pose is applied below.
			if (!context.static) {
				for (const mesh of cubeByMesh.keys()) {
					mesh.eventMode = 'static';
					mesh.hitVolume = 'geometry';
				}
				const pick = (e: unknown): number | null => {
					const t3 = (e as unknown as Event3DFields).target3D;
					return t3 instanceof Mesh3D ? (cubeByMesh.get(t3) ?? null) : null;
				};
				view.on('pointermove', (e) => {
					// touch has no hover — its taps move the sphere all the same
					hoverIndex = e.pointerType !== 'touch' ? pick(e) : null;
					if (context.app.canvas) {
						context.app.canvas.style.cursor = hoverIndex !== null ? 'pointer' : 'default';
					}
				});
				view.on('pointerleave', () => {
					hoverIndex = null;
					if (context.app.canvas) context.app.canvas.style.cursor = 'default';
				});
				view.on('pointertap', (e) => {
					const idx = pick(e);
					if (idx === null || !ctx) return;
					// touch has no hover and no cursor: the tap's own flash is its feedback
					const isTouch = e.pointerType !== 'mouse';
					if (isTouch) tapPulse = { index: idx, t: 0 };
					if (ctx.reducedMotion) {
						// no hops: teleport with one gentle settle (spec — fewer and gentler)
						at = idx;
						target = null;
						motion = { kind: 'rest' };
						settle = { t: 0, from: HOP.settleScale };
						applyPose();
						return;
					}
					const objective = target ?? at;
					if (idx === objective) return; // spec Q5 a/b: already here / already going there
					target = idx;
					if (motion.kind === 'rest') beginHop(); // mid-flight: the hop in flight finishes first
				});
			}

			applyPose(); // pose zero: sphere resting on the first cube
		},

		update(ticker) {
			if (!ctx || ctx.static) return;
			const dt = ticker.deltaMS;

			if (motion.kind === 'hop') {
				motion.t += dt / HOP.durationMs;
				if (motion.t >= 1) {
					// landed: the interruption contract (spec Q5c) resolves here — re-plan
					// from the landing cube, or stop if this hop *was* the new target
					at = motion.to;
					motion = { kind: 'rest' };
					settle = { t: 0, from: 1 - HOP.squash };
					if (target !== null && target !== at) beginHop();
					else target = null;
				}
			}
			if (settle) {
				settle.t += dt;
				if (settle.t >= HOP.settleMs) settle = null;
			}
			applyPose();

			// hover + tap-pulse tint: color only — it stays on under reduced motion
			if (tapPulse) {
				tapPulse.t += dt;
				if (tapPulse.t >= PULSE.attackMs + PULSE.holdMs + PULSE.releaseMs) tapPulse = null;
			}
			for (let i = 0; i < PATH_LENGTH; i++) {
				const goal = i === hoverIndex ? 1 : 0;
				if (hoverT[i] !== goal) {
					hoverT[i] = Math.min(1, Math.max(0, hoverT[i] + (goal === 1 ? dt : -dt) / HOVER.fadeMs));
				}
				let k = easeOut(hoverT[i], 2);
				if (tapPulse && tapPulse.index === i) k = Math.max(k, pulseLevel(tapPulse.t));
				if (k !== tintK[i]) {
					tintK[i] = k;
					cubeMaterials[i].baseColor = mixColor(PALETTE.cream, HOVER.color, k);
				}
			}
		},

		dispose() {
			resizeObserver?.disconnect();
			resizeObserver = null;
			view = null; // the scene graph goes with app.destroy, shell-side
			cubeMaterials = [];
			cubeByMesh = new Map();
			sphere = null;
			hoverIndex = null;
			hoverT.fill(0);
			tintK.fill(0);
			tapPulse = null;
			target = null;
			motion = { kind: 'rest' };
			settle = null;
			ctx = null;
		},
	};
}
