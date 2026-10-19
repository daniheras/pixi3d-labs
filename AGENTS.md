## Language

All code and comments that produce external output must be written in English. This includes source code, code comments, commit messages, documentation, UI copy, and any other user-facing or shared output.

## Autonomy and boundaries

You have full autonomy within the area you are currently working on, but you must stop and ask the user before moving on to a new area of the project.

A "new area" is any shift in what you are building or how you are getting there, for example:

- finishing backend files and moving on to frontend design,
- starting a research spike to gather context you don't already have,
- switching between features, or moving across architectural layers.

This keeps the user aware of where you are and lets them help you stay aimed before you commit to the next chunk of work.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/` (local, no external tracker). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles; each label string equals its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.
