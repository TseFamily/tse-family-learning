# LearningQuest

A responsive, mobile-native HTML5 learning platform foundation for personalised practice. The first live activity is a school-prep starter bank, and the product shell now models reusable curriculum packs for languages, exams, Maths, English, primary learning, and adult learning.

## Current app

- Static Node server in `server.js` serving `index.html` and the 28-question `questions.json` starter bank.
- Responsive platform shell with learning-domain cards for 11+ School Prep, Traditional HK Chinese, Simplified Mandarin Chinese, Maths Foundation, Primary Learning, French, Life in the UK, and English Mastery.
- Curriculum pack roadmap cards for language variant, learner fit, activity type, readiness, and next production step.
- First Traditional HK Chinese flashcard slice is runtime-loaded from `content-packs/hk-chinese-basics.json` with family words, greetings, colours, Jyutping, Cantonese prompts, and English meaning.
- First Simplified Mandarin flashcard slice is runtime-loaded from `content-packs/mandarin-basics.json` with Pinyin, Traditional comparison text, and English meaning.
- First Maths Foundation slice is runtime-loaded from `content-packs/maths-foundation.json` with number-bond, place-value, counting, times-table, arithmetic, fraction, and word-problem practice cards plus number-line models, adaptive answer entry, and weak-skill rotation.
- First Life in the UK slice is runtime-loaded from `content-packs/life-uk.json` with starter mock questions, a 75% pass target, and weak-topic review signals for adult learners.
- Life in the UK review queue now uses polished due/overdue/weak-topic scheduling with priority ranking, capped spaced intervals, and an upcoming-topic preview when nothing is due.
- Browser-local per-learner quiz progress history with attempts, best score, average score, level, daily streak, practice XP, subject dashboard, personalised next-step recommendations, parent overview across learner profiles, family leaderboard, milestone badges, daily challenge prompt, subject/difficulty/skill quick-practice filters, and onboarding-driven recommended curriculum packs, visible progression paths plus scored Chinese matching practice, Traditional/Simplified comparison drills, browser speech audio prompts, runtime Maths Foundation answer-entry practice with number-line visuals and weak-skill rotation, and browser-local matching/progression progress for recommended packs.
- JSON export/import for progress backup between browsers or devices, preserving activity metadata for matching practice, Maths Foundation weak-skill rotation, and Life in the UK weak-topic review.
- Run #7 cleanup keeps startup state declarations single-source and makes progress-backup copy apply to the selected learner.
- Run #8 adds skill/topic quick-practice chips from question metadata, so focused practice can target number fluency, sound patterns, grammar, and logic patterns without changing the question schema.
- Run #8 evening increment turns the Traditional HK Chinese roadmap placeholder into a visible starter flashcard slice.
- Run #24 preserves adaptive activity metadata during progress import, so restored backups keep matching-practice state and Maths Foundation weak-skill rotation.
- Run #29 adds a registry-driven Life in the UK starter mock with 12 civic questions, a 75% pass target, weak-topic review, and progress import support.
- Run #25 turns Life in the UK from a planned placeholder into a runtime content pack with starter mock questions, pass-target scoring, and weak-topic review.
- Deployed through the normal Sylphx product path for project `tart-duo-uvt9`.

## Validation

```bash
npm run build
node server.js
```

Then verify `/`, `/questions.json`, and `/FAMILY_LEARNING_HUB_ROADMAP.md`, including the responsive platform shell text and learning-domain cards.

- Run #9 starts the mobile-first UI/UX rebuild: app-like Today command centre, bottom mobile navigation, clearer Learn/Practice/Progress sections, and a desktop command-centre layout while retaining the existing quiz/progress engine.
- Run #10 fixes real-device mobile clipping/overflow after Kyle review: stricter no-horizontal-overflow rules, left-aligned mobile sections, wrapped curriculum text, lighter cards, safer bottom nav, and hidden sticky duplicate CTA on small screens.
- Run #8 keeps progress backup import discoverable on a fresh browser and removes a duplicate quick-practice filter return.


## Public / commercial-grade direction

This app is being generalized from a family prototype into a public-facing product foundation. The current baseline avoids hardcoded private learner names in the UI, includes a PWA manifest/service worker for app-like mobile launch, and adds GitHub Actions CI for static validation.


## Content packs

- `content-packs/registry.json` is the runtime pack metadata SSOT. It lists reusable packs, paths, schemas, render targets, readiness copy, next-step copy, and recommendation tags used by onboarding-driven curriculum recommendations. The app fetches the registry first, falls back to baked-in registry metadata if unavailable, then loads `content-packs/hk-chinese-basics.json`, `content-packs/mandarin-basics.json`, `content-packs/maths-foundation.json`, and `content-packs/life-uk.json` from the registered paths.
- Runtime content packs are treated as optional curriculum content: if the pack route is temporarily unavailable, core question practice still loads and the curriculum card shows a clear recovery state instead of blocking the app.
