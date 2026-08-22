# Repository Instructions

Start with [`docs/vision.md`](docs/vision.md) and
[`docs/capabilities.md`](docs/capabilities.md) before changing this
repository. Destination is `docs/vision.md`. Identity, fate, dependency, and
Done-when oracles are `docs/capabilities.md`. Cite the `TFL-*` IDs.

`PROJECT.md` and `.doctrine/project.json` project repository lifecycle,
boundaries, public surfaces, delivery model, and adoption gaps. They are not a
second destination. `FAMILY_LEARNING_HUB_ROADMAP.md` is historical prototype
notes and is not current destination.

Use `SylphxAI/doctrine` for enterprise standards. Keep LearningQuest
commercial-grade and data-driven: private learner data, school-specific
promises, and one-family behavior must not become hidden reusable defaults.

`npm test` (`scripts/validate.mjs`) must keep rejecting private family names
in the product shell.

For control-plane-only changes, validate with:

```bash
python3 /Users/kyle/.doctrine/scripts/project-control-plane-audit.py --local . --fail-on-drift --json
git diff --check
```

For product changes, also run `npm test`, `npm run build`, and the relevant
Playwright mobile smoke or deployed readback checks.
