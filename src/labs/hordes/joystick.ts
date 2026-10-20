// Virtual joystick (mobile input): touch anywhere on the stage and the base ring
// spawns under the finger; drag to move (analog, magnitude scales with distance),
// release to stop. Desktop pointers are ignored — WASD stays the only keyboard truth.
// Implemented with pointer events so it degrades to mouse-drag nothing: only
// `pointerType === 'touch'` engages it.
import { HORDES } from './config';

/** Analog movement axis, normalized to magnitude ≤ 1, screen sense (y-down). */
export interface MoveAxis {
	x: number;
	y: number;
}

export interface VirtualJoystick {
	/** Live axis while a finger drives it; zero otherwise. The input system reads this. */
	readonly axis: MoveAxis;
	dispose(): void;
}

/** The base-ring radius in px — the drag distance that maps to full speed. */
const RADIUS = 56;

const BASE_CSS = [
	'position:absolute',
	'display:none',
	'box-sizing:border-box',
	'width:112px',
	'height:112px',
	'border:2px solid rgba(216,207,199,0.45)',
	'border-radius:50%',
	'background:rgba(11,9,8,0.4)',
	'pointer-events:none',
	'z-index:4',
].join(';');

const KNOB_CSS = [
	'position:absolute',
	'display:none',
	'box-sizing:border-box',
	'width:40px',
	'height:40px',
	'border:2px solid rgba(11,9,8,0.6)',
	'border-radius:50%',
	'background:rgba(216,207,199,0.9)',
	'pointer-events:none',
	'z-index:5',
].join(';');

export function attachJoystick(host: HTMLElement): VirtualJoystick {
	const base = document.createElement('div');
	base.style.cssText = BASE_CSS;
	const knob = document.createElement('div');
	knob.style.cssText = KNOB_CSS;
	host.appendChild(base);
	host.appendChild(knob);

	const axis: MoveAxis = { x: 0, y: 0 };
	/** The originating touch pointer, so stray second fingers never steal the stick. */
	let activeId: number | null = null;
	/** Base center in page-relative stage coordinates. */
	let originX = 0;
	let originY = 0;

	function place(baseX: number, baseY: number): void {
		base.style.display = 'block';
		base.style.left = `${baseX - RADIUS - 2}px`;
		base.style.top = `${baseY - RADIUS - 2}px`;
	}

	function follow(fingerX: number, fingerY: number): void {
		let dx = fingerX - originX;
		let dy = fingerY - originY;
		const dist = Math.hypot(dx, dy);
		if (dist > RADIUS) {
			dx = (dx / dist) * RADIUS;
			dy = (dy / dist) * RADIUS;
		}
		knob.style.display = 'block';
		knob.style.left = `${originX + dx - 20}px`;
		knob.style.top = `${originY + dy - 20}px`;
		axis.x = dx / RADIUS;
		axis.y = dy / RADIUS;
	}

	function rest(): void {
		axis.x = 0;
		axis.y = 0;
		base.style.display = 'none';
		knob.style.display = 'none';
		activeId = null;
	}

	function onDown(e: PointerEvent): void {
		if (e.pointerType !== 'touch' || activeId !== null) return;
		const rect = host.getBoundingClientRect();
		// the base spawns where the thumb lands — no hidden corner to find first
		originX = e.clientX - rect.left;
		originY = e.clientY - rect.top;
		activeId = e.pointerId;
		// drag listeners live on the window for this gesture only, so the drag
		// survives capture-less pointers (and the capture itself is best-effort)
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		try {
			host.setPointerCapture(e.pointerId);
		} catch {
			// synthetic/edge-case pointers have no active capture target; the window
			// listeners above carry the gesture
		}
		place(originX, originY);
		follow(e.clientX - rect.left, e.clientY - rect.top);
		e.preventDefault();
	}

	function onMove(e: PointerEvent): void {
		if (activeId === null || e.pointerId !== activeId) return;
		const rect = host.getBoundingClientRect();
		follow(e.clientX - rect.left, e.clientY - rect.top);
	}

	function onUp(e: PointerEvent): void {
		if (activeId === null || e.pointerId !== activeId) return;
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', onUp);
		window.removeEventListener('pointercancel', onUp);
		try {
			host.releasePointerCapture(e.pointerId);
		} catch {
			// nothing captured — fine, the gesture ends all the same
		}
		rest();
	}

	host.addEventListener('pointerdown', onDown);

	return {
		axis,
		dispose() {
			host.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			base.remove();
			knob.remove();
			activeId = null;
			axis.x = 0;
			axis.y = 0;
		},
	};
}
