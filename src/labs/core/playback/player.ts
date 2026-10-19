// The reusable player (ticket 09): a pure timeline controller plus a thin UI helper.
// The controller knows nothing about physics, rendering or the shell — any lab that can
// produce a TimelineSource (a baked physics recording, hand keyframes) drives it. It has
// no clock of its own: the lab advances it from the shell's ticker, so there is exactly
// one loop and pause/resume survives page re-entry for free.
import type { TimelineSource } from './timeline';
import { phaseAt } from './timeline';

export type PlayerState = 'idle' | 'playing' | 'paused';

export interface PlayerOptions {
	/** Wrap to 0 at the end. @default true */
	loop?: boolean;
	/** Start playing immediately. @default false */
	autoplay?: boolean;
}

export interface Player {
	readonly durationMs: number;
	readonly time: number;
	/** 0..1 across the whole timeline, hold included. */
	readonly progress: number;
	readonly state: PlayerState;
	readonly phase: string;
	play(): void;
	pause(): void;
	toggle(): void;
	/** Jump to `tMs` (clamped); pauses nothing — resampling is the caller's job. */
	seek(tMs: number): void;
	/**
	 * Advance by `dtMs` (call from the shell ticker). Returns true when the time moved, so
	 * the lab knows to resample poses. The phase readout and loop events fire from here.
	 */
	advance(dtMs: number): boolean;
	onFrame(fn: (player: Player) => void): () => void;
	onLoop(fn: (player: Player) => void): () => void;
	onPhaseChange(fn: (phase: string) => void): () => void;
}

export function createPlayer(timeline: TimelineSource, options: PlayerOptions = {}): Player {
	const loop = options.loop ?? true;
	const { durationMs } = timeline;

	let time = 0;
	let state: PlayerState = options.autoplay ? 'playing' : 'paused';
	// listeners are a set with unsubscribe: a lab's pose applier and the UI's renderer
	// (and anything else) must coexist — a single slot would let one mute the other
	const frameFns = new Set<(player: Player) => void>();
	const loopFns = new Set<(player: Player) => void>();
	const phaseFns = new Set<(phase: string) => void>();
	let lastPhase = phaseAt(timeline.phases, 0);

	const player: Player = {
		durationMs,
		get time() {
			return time;
		},
		get progress() {
			return durationMs > 0 ? time / durationMs : 0;
		},
		get state() {
			return state;
		},
		get phase() {
			return phaseAt(timeline.phases, time);
		},
		play() {
			if (state === 'playing' || durationMs === 0) return;
			if (state === 'idle' || time >= durationMs) time = 0; // restart from the top
			state = 'playing';
			emit();
		},
		pause() {
			if (state !== 'playing') return;
			state = 'paused';
			emit();
		},
		toggle() {
			if (state === 'playing') player.pause();
			else player.play();
		},
		seek(tMs) {
			const next = Math.max(0, Math.min(durationMs, tMs));
			if (next === time) return;
			time = next;
			emit();
		},
		advance(dtMs) {
			if (state !== 'playing' || dtMs <= 0) return false;
			time += dtMs;

			if (time >= durationMs) {
				if (loop) {
					time %= durationMs;
					for (const fn of loopFns) fn(player);
				} else {
					time = durationMs;
					state = 'paused'; // auto-stop at the end
				}
			}
			emit();
			return true;
		},
		onFrame(fn) {
			frameFns.add(fn);
			return () => frameFns.delete(fn);
		},
		onLoop(fn) {
			loopFns.add(fn);
			return () => loopFns.delete(fn);
		},
		onPhaseChange(fn) {
			phaseFns.add(fn);
			return () => phaseFns.delete(fn);
		},
	};

	function emit(): void {
		const phase = player.phase;
		if (phase !== lastPhase) {
			lastPhase = phase;
			for (const fn of phaseFns) fn(phase);
		}
		for (const fn of frameFns) fn(player);
	}

	return player;
}

export interface PlayerUI {
	dispose(): void;
}

export interface PlayerUIOptions {
	/** Status-line element for the `phase: …` readout; optional. */
	phaseEl?: HTMLElement | null;
}

/**
 * Wire a player to the layout's bar slot: mono text toggle, 1px hairline track with a red
 * fill (draggable scrub), space to toggle, arrows to nudge. Styles are injected here so
 * the player stays self-contained; the layout only reserves `[data-lab-player-slot]`.
 */
export function mountPlayerUI(host: HTMLElement, player: Player, options: PlayerUIOptions = {}): PlayerUI {
	const phaseEl = options.phaseEl ?? null;

	host.innerHTML = '';
	const root = document.createElement('div');
	root.className = 'lab-player';

	const toggle = document.createElement('button');
	toggle.type = 'button';
	toggle.className = 'lab-player-toggle';

	const hit = document.createElement('div');
	hit.className = 'lab-player-hit';
	const track = document.createElement('div');
	track.className = 'lab-player-track';
	track.role = 'slider';
	track.tabIndex = 0;
	track.ariaLabel = 'animation timeline';
	track.ariaValueMin = '0';
	track.ariaValueMax = String(Math.round(player.durationMs));
	const fill = document.createElement('div');
	fill.className = 'lab-player-fill';
	track.appendChild(fill);
	hit.appendChild(track);

	root.appendChild(toggle);
	root.appendChild(hit);
	host.appendChild(root);

	const style = document.createElement('style');
	style.textContent = `
		.lab-player {
			flex: none;
			display: flex;
			align-items: center;
			gap: 3ch;
			padding: 12px 48px 10px;
			font-size: 13px;
		}
		.lab-player-toggle {
			font: inherit;
			letter-spacing: inherit;
			background: none;
			border: none;
			padding: 0;
			cursor: pointer;
			color: #e5483c;
		}
		.lab-player-toggle:hover {
			color: #ff5f4d;
		}
		.lab-player-toggle:focus-visible,
		.lab-player-track:focus-visible {
			outline: 1px dashed #e5483c;
			outline-offset: 4px;
		}
		.lab-player-hit {
			flex: 1;
			padding: 10px 0;
			cursor: ew-resize;
			touch-action: none;
		}
		.lab-player-track {
			position: relative;
			height: 1px;
			background: #2a1f1a;
		}
		.lab-player-fill {
			position: absolute;
			inset: 0;
			background: #e5483c;
			transform-origin: left center;
			transform: scaleX(0);
		}
		@media (max-width: 720px) {
			.lab-player {
				padding-left: 22px;
				padding-right: 22px;
			}
		}
	`;
	host.appendChild(style);

	const toggleLabel = (): string => (player.state === 'playing' ? 'pause' : player.state === 'paused' ? 'resume' : 'play');
	const render = (): void => {
		toggle.textContent = toggleLabel();
		toggle.setAttribute('aria-label', `${player.state === 'playing' ? 'pause' : 'play'} the animation`);
		fill.style.transform = `scaleX(${player.progress})`;
		track.ariaValueNow = String(Math.round(player.time));
		track.ariaValueText = `${(player.time / 1000).toFixed(1)}s of ${(player.durationMs / 1000).toFixed(1)}s`;
		if (phaseEl) {
			phaseEl.hidden = false;
			phaseEl.textContent = `phase: ${player.phase}`;
			if (player.state === 'playing') phaseEl.setAttribute('data-live', '');
			else phaseEl.removeAttribute('data-live');
		}
	};

	const offFrame = player.onFrame(render);
	render();

	// scrub: pointer down anywhere on the track seeks, drag keeps seeking
	let scrubbing = false;
	const seekFromEvent = (e: PointerEvent): void => {
		const rect = track.getBoundingClientRect();
		if (rect.width <= 0) return;
		player.seek(((e.clientX - rect.left) / rect.width) * player.durationMs);
	};
	const onPointerDown = (e: PointerEvent): void => {
		scrubbing = true;
		hit.setPointerCapture(e.pointerId);
		seekFromEvent(e);
	};
	const onPointerMove = (e: PointerEvent): void => {
		if (scrubbing) seekFromEvent(e);
	};
	const onPointerUp = (e: PointerEvent): void => {
		scrubbing = false;
		hit.releasePointerCapture(e.pointerId);
	};
	hit.addEventListener('pointerdown', onPointerDown);
	hit.addEventListener('pointermove', onPointerMove);
	hit.addEventListener('pointerup', onPointerUp);

	// keyboard: space toggles (unless focus is on the toggle, which toggles by click),
	// arrows nudge ±5%, Home/End jump
	const toggleOnClick = (): void => player.toggle();
	toggle.addEventListener('click', toggleOnClick);

	const onKeyDown = (e: KeyboardEvent): void => {
		if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.code === 'Space') {
			if (e.target === toggle) return; // the button's click already toggles
			e.preventDefault();
			player.toggle();
			return;
		}
		const onSlider = e.target === track;
		if (!onSlider) return;
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault();
			const dir = e.key === 'ArrowRight' ? 1 : -1;
			player.seek(player.time + dir * player.durationMs * 0.05);
		} else if (e.key === 'Home') {
			e.preventDefault();
			player.seek(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			player.seek(player.durationMs);
		}
	};
	window.addEventListener('keydown', onKeyDown);

	// one player per page; view transitions replace the DOM, but the window listener
	// must not survive the departure
	document.addEventListener('astro:before-swap', dispose, { once: true });

	function dispose(): void {
		offFrame();
		window.removeEventListener('keydown', onKeyDown);
		hit.removeEventListener('pointerdown', onPointerDown);
		hit.removeEventListener('pointermove', onPointerMove);
		hit.removeEventListener('pointerup', onPointerUp);
		host.innerHTML = '';
	}

	return { dispose };
}
