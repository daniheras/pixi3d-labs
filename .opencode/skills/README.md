# Skills

## mattpocock/skills

These skills are vendored from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT, see `LICENSE`).

- Source commit: `49dd158d1076134a641b33efb035946536778336`
- Buckets included: `skills/engineering`, `skills/productivity` (27 skills)
- Buckets excluded: `skills/deprecated`, `skills/misc`, `skills/in-progress`
- Per-skill `agents/openai.yaml` files (Codex-specific) were removed.

## Updating

Re-vendor by hand: clone/pull the upstream repo and copy the two buckets again, then drop the `agents/` directories.

```sh
git clone https://github.com/mattpocock/skills.git /tmp/mattpocock-skills
# ... re-copy skills/engineering and skills/productivity into .opencode/skills/<id>/
```

Run `/setup-matt-pocock-skills` once to configure the issue tracker, triage labels, and domain doc layout that the engineering skills assume.

The 16 user-invoked skills are also exposed as `/matt:<name>` commands (e.g. `/matt:implement`), defined in `.opencode/opencode.jsonc`.

## emilkowalski/skills

These skills are vendored from [emilkowalski/skills](https://github.com/emilkowalski/skills) (MIT, see `LICENSE-emilkowalski`).

- Source commit: `2d228630ba1446365f614a108cb8252f1feda202`
- All 15 skills under `skills/` are included as-is: `emil-design-eng`, `animate`, `animate-expo`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance`, `animation-vocabulary`, `apple-design`, `write-swift`, `pick-ui-library`, `mobile-native`, `break-ui`, `ask-sonner`.
- `prototype` collided with mattpocock's skill of the same name, so it is vendored as `emil-prototype/` (its frontmatter `name` was changed to match).
- The 15 skills are exposed as `/emil:<name>` commands (e.g. `/emil:animate`), also defined in `.opencode/opencode.jsonc`.

## Impeccable

The `impeccable` skill is installed and updated through its own installer, not vendored by hand.

- Source: [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0)
- Installed via: `npx impeccable install --providers=opencode --scope=project`
- Engine binary under `scripts/bin/` is gitignored; the launcher downloads and verifies it on first run.
- Update with: `npx impeccable update`

Run `/impeccable init` once per project to set up `PRODUCT.md` and design context.
