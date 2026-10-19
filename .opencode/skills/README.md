# Vendored skills

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
