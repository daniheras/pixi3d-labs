// OG card capture: drives a headless system Chrome against `astro preview` and
// photographs each page into public/og/*.png at 1200x630 — the exact shots the
// repo currently ships. one node script so CI reproduces the cards man-run-for-man.
//
// scene pages use the shell's capture affordances:
// - ?static  — one fixed-delta frame (shell.ts renders it, ticker stopped)
// - ?t=<ms>  — voxel-wall only: freeze the baked take at that instant (scene.ts)
// index has no scene; a plain load is fine.
//
// usage: node scripts/capture-og.mjs [baseURL]
//   baseURL defaults to http://localhost:4400

import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE_URL = process.argv[2] ?? 'http://localhost:4400';
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');
const VIEWPORT = { width: 1200, height: 630, deviceScaleFactor: 1 };

// system Chrome on the GitHub-hosted ubuntu runner images (no browser download)
const executablePath = process.env.CHROME_PATH ?? '/usr/bin/google-chrome-stable';

const SHOTS = [
	{ name: 'index', url: '/', ready: '.row' },
	{ name: 'hello-cube', url: '/labs/hello-cube/?static', ready: 'canvas' },
	{ name: 'voxel-wall', url: '/labs/voxel-wall/?t=1600', ready: 'canvas' }, // the impact bite
	{ name: 'ak47', url: '/labs/ak47/?static', ready: 'canvas' },
	{ name: 'interaction', url: '/labs/interaction/?static', ready: 'canvas' },
];

const browser = await puppeteer.launch({
	executablePath,
	headless: true,
	// software GL: runners have no GPU; swiftshader serves the webgl fallback path
	args: ['--disable-gpu', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
});

try {
	await mkdir(OUT_DIR, { recursive: true });
	for (const shot of SHOTS) {
		const page = await browser.newPage();
		await page.setViewport(VIEWPORT);
		// 'domcontentloaded' + waitForSelector, NOT networkidle: the app keeps live
		// traffic going (prefetch, animation frames) so an idle network never arrives
		await page.goto(new URL(shot.url, BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 60_000 });
		await page.waitForSelector(shot.ready, { timeout: 60_000 });
		// 2s settle: entrance animations finish, backend readout resolves, frames flush
		await new Promise((r) => setTimeout(r, 2_000));
		await page.screenshot({ path: path.join(OUT_DIR, `${shot.name}.png`) });
		console.log(`captured: public/og/${shot.name}.png  (${shot.url})`);
		await page.close();
	}
} finally {
	await browser.close();
}
