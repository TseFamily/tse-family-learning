# LearningQuest

`tse-family-learning` is an active application repository for the LearningQuest
mobile-first learning platform foundation. It owns the static Node-served app,
PWA assets, learner progress model, browser-local backup/import behavior,
curriculum content-pack registry, starter packs, validation script, Playwright
mobile smoke, and deployment notes for this product.

## Lifecycle And Layer

- Lifecycle: `active`
- Layer: `application`

## Goals

- Provide a reusable, mobile-native learning practice product foundation with
  curriculum packs and browser-local learner progress.
- Keep static app runtime, content-pack registry, starter packs, PWA shell,
  validation, mobile smoke tests, and deployment docs coherent.
- Continue generalizing from family prototype toward public commercial-grade
  learning product behavior without hardcoded private learner assumptions.

## Non-Goals

- Own a company-wide education platform, every future curriculum, school
  admissions policy, or private learner identity source of truth.
- Hide one family's private data, school-specific policy, or learner-specific
  behavior in reusable product defaults.
- Publish enterprise doctrine, org rulesets, rollout issue reconciliation, or
  shared CI policy.

## Boundaries

This repository owns the LearningQuest product foundation and repo-local content
packs. Curriculum and learner behavior must stay data-driven through documented
content pack and browser-local progress surfaces. Private family-specific
information must not become reusable product defaults.

## Public Surfaces

- `README.md`, `DEPLOY.md`, `DEBUG.md`, and
  `FAMILY_LEARNING_HUB_ROADMAP.md` document product state and operation.
- `index.html`, `server.js`, `sw.js`, and `manifest.webmanifest` define the
  static app and PWA runtime.
- `content-packs/registry.json` and `content-packs/*.json` define curriculum
  content packs.
- `questions.json` defines the starter question bank.
- `scripts/validate.mjs` and `tests/mobile-shell.spec.mjs` define validation
  and mobile smoke evidence.
- `.github/workflows/ci.yml` defines repository CI.
- `.doctrine/project.json` is the machine-readable project manifest.

## Delivery

Pull requests and merge groups run CI validation, build, and Playwright mobile
smoke. Deployment uses the normal Sylphx product path for project
`tart-duo-uvt9`. Production proof requires CI plus deployed app readback for
the affected route, content pack, PWA asset, or browser-local progress flow.
The static app is mostly source-revertable, while user-local exported/imported
progress requires compatibility care.

The authoritative control-plane record is `.doctrine/project.json`.
