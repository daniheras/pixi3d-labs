# Deploy static assets on Cloudflare Workers, built locally with Wrangler

PRODUCT.md left the deployment target explicitly undecided (Vercel / Netlify /
GitHub Pages). Choosing among them surfaced a hard constraint: the site is a
pure static Astro build, so every git-connected CI platform would need to run
`npm ci` in the cloud — and `@pixi/3d@0.1.0-beta.2` installs from a release
tarball that is invite-only (absent from npm) and gitignored by directive
("never commit the binary"). A CI build would force either committing the
tarball or hosting it elsewhere. Meanwhile the `daniheras.dev` zone already
lives in the user's Cloudflare account. We decided on **Cloudflare Workers
serving static assets**, deployed by Wrangler from local builds: `npm run deploy`
runs `astro build && wrangler deploy` against `wrangler.jsonc`, which also
attaches the custom domain `labs.daniheras.dev` (`custom_domain` route — DNS
and certificate provision themselves).

## Considered options

- **Git-connected CI (Cloudflare Pages / Netlify / Vercel)**: push-to-deploy,
  but the build needs the beta tarball, which must not enter the repo. Rejected.
- **Commit the beta tarball so CI can build**: MIT permits redistribution, but
  it contradicts the repo's own `.gitignore` directive and makes the public
  repo the beta's distribution channel. Rejected.

## Consequences

- Deploys are manual and machine-local: a new machine needs the beta tarball
  restored to the repo root and `npx wrangler login` before `npm run deploy`.
- The public repo redistributes no beta code; the deployed site still ships the
  beta compiled into its JS — inherent to a public demo site (honest-beta rule).
- Same-platform path to SSR: adding the Astro Cloudflare adapter later changes
  the build, not the deployment story.
