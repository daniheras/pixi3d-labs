// HUD (ticket 03): a DOM overlay on the layout's scene host, refreshed at 4 Hz from the
// ticker's own cadence — downsampled exactly so the HUD renders nothing into the
// measured frame budget. Reads live query counts (no dirty-trick state) and shows the
// game-over banner when the director flips the flag.
import type { LabContext } from '../../core/shell';
import { HORDES } from '../config';
import { countsForHud } from './systems/step';
import type { HordeBundle } from './world';

const REFRESH_MS = 1000 / HORDES.hud.refreshHz;

export interface Hud {
	elem: HTMLElement;
	refresh(bundle: HordeBundle): void;
	/** The centered game-over banner; null hides it (the scene owns the 1 s timing). */
	banner(text: string | null): void;
	dispose(): void;
}

/** Build the HUD inside the scene host (next to the canvas, absolutely positioned). */
export function createHud(ctx: LabContext): Hud {
	const elem = document.createElement('div');
	elem.dataset.labHud = '';
	elem.style.cssText = [
		'position:absolute',
		'top:12px',
		'left:12px',
		'padding:10px 14px',
		'background:rgba(11,9,8,0.72)',
		'border:1px solid rgba(216,207,199,0.14)',
		'border-radius:10px',
		'font:600 12px/1.6 ui-monospace, monospace',
		'letter-spacing:0.04em',
		'color:rgba(216,207,199,0.9)',
		'pointer-events:none',
		'user-select:none',
		'white-space:pre',
		'z-index:2',
	].join(';');
	ctx.host.appendChild(elem);

	let lastRefresh = -Infinity;
	let lastLines = '';
	const banner = gameBanner();

	return {
		elem,
		// gate on real time, not the sim clock: after game over the simulation freezes,
		// and a sim-time gate would degenerate into a per-frame refresh (2 live queries)
		refresh(bundle) {
			const now = performance.now();
			if (now - lastRefresh < REFRESH_MS) return;
			lastRefresh = now;

			const counts = countsForHud(bundle);
			const lines = [
				`fps      ${fpsLabel(ctx.app)}`,
				`enemies  ${counts.enemies}`,
				`bullets  ${counts.bullets}`,
				`kills    ${counts.kills}`,
				`lives    ${'♥'.repeat(counts.lives) || '—'}`,
				bundle.director.gameOver ? 'GAME OVER' : '',
			]
				.filter(Boolean)
				.join('\n');
			if (lines !== lastLines) {
				lastLines = lines;
				elem.textContent = lines;
			}
		},
		banner(text) {
			banner.set(text);
		},
		dispose() {
			elem.remove();
			banner.dispose();
		},
	};
}

/** Build the centered game-over banner element, shown only while the scene asks. */
function gameBanner(): { set(text: string | null): void; dispose(): void } {
	const elem = document.createElement('div');
	elem.dataset.labHud = 'banner';
	elem.style.cssText = [
		'position:absolute',
		'top:50%',
		'left:50%',
		'transform:translate(-50%, -50%)',
		'padding:14px 28px',
		'background:rgba(11,9,8,0.8)',
		'border:1px solid rgba(229,72,60,0.5)',
		'border-radius:12px',
		'font:700 28px/1.2 ui-monospace, monospace',
		'letter-spacing:0.14em',
		'color:#ff5f4d',
		'text-transform:uppercase',
		'pointer-events:none',
		'user-select:none',
		'z-index:3',
	].join(';');
	elem.hidden = true;
	document.querySelector('[data-lab-stage]')?.appendChild(elem);

	return {
		set(text) {
			if (text === null) elem.hidden = true;
			else {
				elem.hidden = false;
				elem.textContent = text;
			}
		},
		dispose() {
			elem.remove();
		},
	};
}

/** The app ticker's own smoothed FPS, live and honest — pixi computes it over ~1s. */
function fpsLabel(app: LabContext['app']): string {
	const fps = app.ticker.FPS;
	return Number.isFinite(fps) && fps > 0 ? fps.toFixed(0) : '—';
}
