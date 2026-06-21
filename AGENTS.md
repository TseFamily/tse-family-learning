# Repository Instructions

Start with `PROJECT.md`, `.doctrine/project.json`, `README.md`, and
`FAMILY_LEARNING_HUB_ROADMAP.md` before changing this repository. `PROJECT.md`
and `.doctrine/project.json` define the project goal, lifecycle, boundaries,
public surfaces, delivery model, and adoption gaps.

Use `SylphxAI/doctrine` for enterprise standards. Keep LearningQuest
commercial-grade and data-driven: private learner data, school-specific
promises, and one-family behavior must not become hidden reusable defaults.

For control-plane-only changes, validate with:

```bash
python3 /Users/kyle/.doctrine/scripts/project-control-plane-audit.py --local . --fail-on-drift --json
git diff --check
```

For product changes, also run `npm test`, `npm run build`, and the relevant
Playwright mobile smoke or deployed readback checks.
