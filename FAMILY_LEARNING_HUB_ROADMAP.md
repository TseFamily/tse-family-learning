# Family Learning Hub Roadmap

## Current baseline

- Static Node app served by `server.js`.
- Current public content is Wilson's School 11+ practice in `questions.json`, now expanded to 28 starter questions.
- The live Sylphx app should remain simple, safe, and easy to recover.
- The app is being reshaped from a single quiz into a fully responsive multi-subject learning platform with explicit curriculum-pack roadmap slices.

## Product direction

Grow the app from a single Silas quiz into a family learning hub for:

- Silas: age-appropriate Maths, English, Chinese, and school-prep MCQs.
- Sylvie: early-years vocabulary, phonics, counting, colours, and picture-led MCQs.
- Kyle and Cheryl: future Life in the UK, French, Chinese, and family learning content.

## First durable data model

Start with browser-local storage rather than accounts or server-side secrets:

- `learners`: profile id, display name, avatar, age band, preferred subjects.
- `questionSets`: subject, level, tags, language, source, estimated time.
- `attempts`: learner id, question set id, answers, score, completed at.
- `progress`: XP, level, streak, badges, last practice date.
- Current implementation starts with a responsive platform shell, learning-domain cards, onboarding-recommended curriculum-pack cards, browser-local learner profiles, attempts, best score, average score, level, daily streak, practice XP, per-learner subject dashboard, personalised next-step recommendations, parent overview across learner profiles, family leaderboard, and subject, difficulty, and skill quick-practice filters.

Export/import JSON is now available for browser-local progress so family progress is not easily lost. Silas, Sylvie, Kyle, and Cheryl can now keep separate local history buckets.

## Platform foundation sequence

1. Responsive app shell that no longer presents as only Silas's quiz. *(Shipped with the Family Learning Hub platform hero.)*
2. Learning-domain cards for 11+ School Prep, Traditional HK Chinese, Simplified Mandarin Chinese, Maths Foundation, Primary Learning, French, Life in the UK, and English Mastery. *(Shipped as explicit curriculum placeholders; only 11+ currently has live questions.)*
3. Curriculum-pack data model for topics, levels, skills, languages, activities, and readiness state. *(Started with visible curriculum-pack roadmap cards for Wilson 11+, Traditional HK Chinese, Simplified Mandarin, Maths Foundation, Life in the UK, and French; Traditional HK Chinese now has the first visible flashcard slice.)*
4. Domain-specific learner journeys and parent planning view.
5. Content authoring workflow for adding validated packs without editing the whole app shell.

## Gamification sequence

1. Progress export/import JSON. *(Shipped for browser-local history.)*
2. Learner profile picker. *(Shipped for browser-local profiles.)*
3. Per-learner score history in local storage. *(Shipped for browser-local profiles.)*
4. XP and level calculation from completed quizzes. *(Started with local practice XP.)*
5. Daily practice streaks. *(Shipped for browser-local history.)*
6. Per-learner subject dashboard. *(Shipped for browser-local history.)*
7. Parent overview across learners. *(Shipped for browser-local histories.)*
8. Badges for milestones. *(Started with local milestone badges for first quiz, high score, streak, attempts, subject breadth, and XP level.)*
9. Family challenge of the day. *(Started with a deterministic daily prompt from the current question bank.)*
10. Family leaderboard. *(Shipped for browser-local learner histories.)*
11. Subject quick-practice filters before starting a quiz. *(Shipped for focused rounds from the existing question bank.)*
12. Personalised next-step practice recommendations from learner history. *(Shipped for browser-local learner history.)*
13. Topic/difficulty filters before starting a quiz. *(Expanded with difficulty-band and skill/topic quick-practice filters powered by question metadata: Foundation/Core/Stretch plus number fluency, sound patterns, grammar, and logic patterns.)*


## Quality sequence

1. Keep startup JavaScript deterministic: no duplicate state declarations or duplicated learner-note writes. *(Verified in run #7.)*
2. Keep learner-facing copy generic where progress belongs to the selected learner, not only Silas. *(Shipped in run #7 for progress backup copy.)*
3. Keep progress backup recovery visible even before a learner has local history. *(Shipped in run #8 so import is discoverable on a fresh browser.)*

## Content sequence

1. Keep existing Wilson's School 11+ quiz stable. *(Stable and expanded to 28 starter questions.)*
2. Add metadata to quiz files without breaking current rendering. *(Skill metadata now powers focused quick-practice filters.)*
3. Split content by subject and age band.
4. Add Chinese and English language toggles where useful. *(Roadmap now distinguishes Traditional HK/Cantonese from Simplified Mandarin/Pinyin, and the first Traditional HK family-word flashcards are visible in the app.)*
5. Add adult practice sets later.


## Content-pack activation

The first non-11+ content slice is now visible in the curriculum area: Traditional HK Chinese family-word flashcards for 爸爸, 媽媽, 哥哥, 妹妹, and 多謝, with Jyutping, simple Cantonese-style romanisation prompts, English meaning, and family-use prompts. Next content-pack work should move this inline seed into a reusable JSON pack shape before it grows too large.

## Security and deployment notes

- Do not put webhook secrets, private API tokens, or family-sensitive backend keys in public JavaScript.
- Keep deployment reproducible through the normal Sylphx generated build path and `npm` scripts.
- Prefer small, reviewable increments and verify `/` plus `/questions.json` after deploy.

## Mobile-first modern UX rebuild

Kyle flagged the current experience as not modern/responsive enough. The platform direction is now mobile-first: Today command centre, touch-friendly action flow, app-like mobile navigation, clearer Learn/Practice/Progress IA, and desktop parent command-centre layouts.

### Real-device mobile correction

After iPhone/Safari review, the next UX baseline requires zero horizontal clipping, left-aligned mobile section headers, wrapped curriculum card copy, lighter cards, and no duplicated sticky CTA fighting the browser toolbar.


## Public product foundation — 2026-06-07

Kyle requested a shift from a family-specific prototype to a public-facing, production-ready, commercial-grade HTML5 mobile app. The next architecture direction is user-centric: reusable learner profiles, coach/parent insights, curriculum packs, PWA/mobile-native behaviour, CI governance, and no hardcoded private family names in the visible product shell.

Shipped first foundation slice:
- Renamed visible app shell to LearningQuest.
- Generalized learner profiles and copy away from private family members.
- Added PWA manifest and service worker for mobile app-like launch/offline caching.
- Added GitHub Actions CI validation for HTML/script syntax, question schema, PWA files, and private-name regression checks.

Next slices:
- ✅ Externalized the first Traditional HK Chinese flashcard slice into `content-packs/hk-chinese-basics.json` and expanded it to family words, greetings, colours, and counting starters.
1. Add onboarding: create learner profile, age band, goal, and preferred curriculum.
2. Split inline JS/CSS/data into typed app modules and JSON content packs.
3. Add mobile-native mission mode as the default first screen.
4. Add accessibility, Playwright mobile no-overflow tests, and branch protection required checks.
5. Add SaaS-ready auth/storage/backend later; do not embed secrets in public static JS.


## Run #10 content-pack loader

- Traditional HK Chinese starter cards are now fetched from `content-packs/hk-chinese-basics.json` at runtime.
- The browser validates the pack id and flashcard fields before rendering.
- Validation now rejects inline flashcard seed data so future packs stay external and reusable.

## Run #11 optional content-pack resilience

- The Traditional HK Chinese content-pack loader now fails soft: a missing or invalid optional pack shows a clear curriculum recovery state while the core question-practice app remains available.
- Playwright mobile coverage now simulates a content-pack outage and verifies the mission onboarding/start path still renders.

## Run #12 Simplified Mandarin content-pack slice

- Added `content-packs/mandarin-basics.json` as a second reusable Chinese curriculum pack with 10 Simplified Mandarin flashcards.
- The app now runtime-loads and browser-validates both Traditional HK Chinese and Simplified Mandarin starter packs.
- Mobile regression coverage verifies the Mandarin cards render and that a Mandarin pack outage fails soft while the core mission and HK Chinese pack remain available.

## Run #13 content-pack registry metadata

- Added `content-packs/registry.json` as the runtime metadata source of truth for reusable curriculum packs.
- The app now loads registry metadata before optional packs, uses registered paths for HK Chinese and Mandarin pack fetches, and falls back to baked-in registry metadata if the registry route is temporarily unavailable.
- Validation now cross-checks registry ids, paths, schemas, and required display metadata against the actual pack files.
- Mobile regression coverage verifies both registered packs still render when the registry endpoint is unavailable.


## Run #14 learner-specific pack recommendations

- Onboarding stage and learning goal now rank curriculum cards, marking the best two packs as recommended.
- Runtime content-pack registry entries carry `recommendedStages` and `recommendedGoals` metadata, keeping pack recommendation hints with the registry SSOT.
- Recommendations re-render immediately when the learner switches stage or goal and remain resilient when optional pack routes are loading or unavailable.
- Mobile regression coverage verifies exam-prep learners see the 11+ starter bank and adult language learners see registry-driven Mandarin recommendations.


## Run #15 recommendation progression paths

- Recommended curriculum cards now include a visible three-step progression path, turning recommendations into an actionable learning journey rather than only a label.
- Runtime content-pack registry entries carry `progressionSteps` metadata for HK Chinese and Mandarin, keeping progression guidance alongside the pack metadata SSOT.
- Inline planned packs and the 11+ starter bank include matching progression paths so every recommended card can explain the next sequence.
- Mobile regression coverage verifies exam-prep and adult-language recommendation paths and exposes `recommendedProgressionPaths` test-state evidence.


## Run #16 Chinese matching activity

- Added a registry-driven activity beyond flashcards for the live HK Chinese and Mandarin packs.
- The curriculum now renders matching-practice panels from runtime pack flashcards, pairing Chinese terms with English meaning and sound clues.
- Pack and registry metadata now advertise `Flashcards + matching + listen/repeat`, keeping activity promises aligned with the content-pack SSOT.
- Mobile regression coverage verifies both matching panels and `matchingPracticeCounts` test-state evidence.


## Run #17 interactive matching scores

- Turned Chinese matching practice from display-only panels into tappable answer-choice cards.
- Added per-pack score summaries for HK Chinese and Mandarin matching practice using the runtime pack flashcards as the source of truth.
- Exposed `matchingPracticeScores` test-state evidence and mobile coverage for matched answers.


## Run #18 matching progress persistence

- Persisted Chinese matching-practice answers into the same browser-local learner history used by quizzes.
- Matching progress now contributes to progress stats, subject dashboard, leaderboard XP, backup/export, and next-step recommendations.
- Added `latestMatchingProgress` test-state evidence plus mobile coverage proving HK Chinese and Mandarin matching entries are saved.


## Run #19 Traditional/Simplified comparison drill

- Added a runtime Traditional/Simplified comparison drill that joins shared meanings across the HK Chinese and Mandarin content packs.
- The drill highlights same-form words versus changed characters with Jyutping and Pinyin side by side.
- Added `comparisonDrillCards`, `renderChineseComparisonDrill`, and `comparisonDrillPairs` test-state evidence.


## Run #20 Chinese audio prompts

- Added browser Web Speech audio prompt controls to runtime HK Chinese and Mandarin flashcards.
- Audio controls expose `speakChinesePrompt`, `audioPromptCards`, `audioPromptCounts`, `audioPromptLocales`, and `latestAudioPrompt` evidence for validation.
- Controls gracefully show visible fallback status when a browser lacks speech synthesis support.

## Run #21 Maths Foundation pack

- Added a registry-driven `maths-foundation-v1` content pack with 10 practice cards for number bonds, place value, counting, times tables, addition, subtraction, fractions, and word problems.
- The runtime now loads `content-packs/maths-foundation.json`, renders Maths Foundation practice cards, and recommends the pack for early/primary confidence or mastery goals.
- Added `mathsFoundationPackId`, `mathsFoundationCardCount`, and `mathsFoundationTopics` test-state evidence plus mobile fallback coverage for the optional pack.


## Run #22 Maths Foundation answer practice

- Upgraded Maths Foundation practice cards from answer reveal cards into adaptive answer-entry drills.
- Learners now type answers, receive immediate correctness feedback, unlock strategies, and save Maths Foundation progress into learner history.
- Added `mathsFoundationPracticeScores` and `latestMathsFoundationProgress` test-state evidence plus mobile coverage for solved-answer persistence.

## Run #23 Maths Foundation number-line rotation

- Added number-line visual models to Maths Foundation answer-entry cards for number bonds, skip counting, bridge-10, count-back subtraction, and word-problem addition.
- Added learner-history-aware weak-skill rotation: incorrect Maths Foundation attempts persist `weakSkills` and move those skills to the front of the next practice render.
- Added `mathsFoundationNumberLineCount`, `mathsFoundationWeakSkills`, and `mathsFoundationRotationMode` test-state evidence plus mobile coverage for weak-skill prioritisation.


## Run #24 adaptive progress import

- Progress import now preserves activity metadata instead of flattening every backup into generic quiz history.
- Imported matching-practice backups restore visible matching score state for HK Chinese and Mandarin cards.
- Imported Maths Foundation backups keep `skillResults`, `weakSkills`, and `rotationMode`, so weak-skill rotation still prioritises recently missed skills after moving to a new browser/device.
- Added `cleanHistoryEntry`, `restoreProgressRuntimeState`, and mobile coverage for adaptive backup restoration.

## Run #25 Life in the UK starter mock

- Added `content-packs/life-uk.json` as the first adult-learning exam pack, registered through `content-packs/registry.json`.
- The curriculum surface now renders a Life in the UK starter mock with six practice cards from the runtime pack, a visible 75% pass target, explanations after answering, and saved weak-topic review signals.
- Progress import/restore and coach recommendations now preserve `life-uk-practice` metadata, so adult learners can resume weak-topic review from backup files.
- Next: expand the starter slice into a full 24-question, 45-minute mock flow with official-topic weighting.

## Run #26 Chinese audio slow-repeat practice mode

- Added a slow-repeat control to runtime HK Chinese and Mandarin audio prompts at a `0.62x` speech rate alongside the normal `0.82x` rate.
- Per-card slow replay state, observable slow replay counts/rates, validation markers, and mobile smoke coverage shipped with the audio prompt surface.
- Shipped via PR #22 (`f42b732`), verified live alongside the full timed mock.

## Run #27 project control-plane manifest

- Added `.doctrine/project.json`, `AGENTS.md`, and `PROJECT.md` documenting the LearningQuest product foundation: lifecycle, layer, goals, non-goals, owned boundaries, and public surfaces.
- The manifest keeps the static app shell, content-pack registry, starter packs, PWA shell, validation, and deployment docs coherent as the product generalises from family prototype toward public commercial-grade behaviour.
- Shipped via PR #26 (`5f0743e`).

## Run #28 Life in the UK full timed mock

- Expanded the Life in the UK starter slice into a full 24-question, 45-minute timed mock flow with official-topic weighting across History, Government, Parliament, Law, Democracy, Society, Geography, Culture, Values, Rights, UK nations, and Economy.
- The mock surfaces a live countdown timer (urgent state under 5 minutes), answer-by-answer feedback, finish-early/cancel controls, a full review list, and a 75% pass target with pass/fail result state.
- Full-mock progress persists as `life-uk-practice` with `practiceMode: 'life-uk-full-mock'`, per-topic `skillResults`, and `weakSkills`, so adult learners can resume weak-topic review and the coach can recommend next steps.
- Shipped via PR #27 (`5327eea`), verified live: `/` HTTP 200, `/content-packs/life-uk.json` HTTP 200 with 24 questions, registry and maths routes healthy.
- Next: add adaptive weak-topic drills that pull from saved full-mock review data.

## Run #29 Life in the UK adaptive weak-topic drill

- Added an adaptive weak-topic drill that pulls from saved full-mock review data (`weakSkills` and `skillResults` on `life-uk-full-mock` progress entries) and surfaces targeted practice for the learner's weakest Life in the UK topics.
- The drill selects 6 questions weighted toward the learner's weakest topics, shows a source label (Full-mock review / Starter practice), and persists results as `life-uk-practice` with `practiceMode: 'life-uk-weak-topic-drill'`, including per-topic `skillResults` and `weakSkills`.
- Added drill state management (`lifeUKDrillState`, `lifeUKDrillScores`, `lifeUKDrillSelectedAnswers`), validation markers, registry metadata update, and mobile smoke coverage (9/9 tests passing).
- Shipped via PR #29 (`e9531a6`), verified on GitHub Pages (195538b, drill markers confirmed). Sylphx production deploy pending propagation.

## Run #30 Life in the UK per-topic scoring breakdown

- Added a per-topic correct/attempted breakdown table to the Life in the UK full-timed-mock and adaptive weak-topic-drill result views, rendered from saved `skillResults`.
- Each row shows topic, score (e.g. `0/2 · 0%`), and a strong/weak colour cue, sorted by weakest topics first so learners can see exactly where to focus next.
- Added `lifeUKTopicBreakdownRows`, `lifeUKTopicBreakdownHtml`, `.life-uk-topic-breakdown` styles, validation markers (`life-uk-topic-breakdown`, `Per-topic breakdown`), and mobile smoke assertions verifying the breakdown renders in both mock and drill result views.
- Next: add topic-spaced repetition across the entire question bank using the per-topic breakdown as the prioritisation signal.

## Run #31 Life in the UK expanded question bank + shuffled selection

- Expanded the Life in the UK content pack from 24 to 48 questions, adding 24 new accurate citizenship questions so every one of the 12 official topics now has at least 4 questions (was as low as 1-2 for some topics).
- The full timed mock and adaptive weak-topic drill now draw from a Fisher-Yates shuffle of the full 48-question bank each run (`lifeUKShuffledQuestions`), so repeat mock attempts see a fresh 24-question selection instead of always the same first 24 questions in file order.
- Validation now enforces a 40+ question minimum, per-topic coverage of at least 4 questions per topic, and duplicate-prompt detection, so future content edits cannot silently regress bank coverage or variety.
- Added `lifeUKFullMockSelectedQuestions` runtime state, updated registry/content-pack metadata (`expanded question bank`, `shuffled selection`), validation markers, and mobile smoke coverage (9/9 tests passing, including a fixed-shuffle assertion for full-mock and drill flows).
- Next: add topic-spaced repetition across the expanded question bank using the per-topic breakdown as the prioritisation signal.

## Run #32 Life in the UK topic-spaced-repetition review queue

- Aggregates per-topic mastery across all saved `life-uk-practice` history entries (`skillResults`) and stores a browser-local spaced-repetition schedule per topic (`learningquest-life-uk-topic-sr-v1`).
- Surfaces a **Review queue** card on the Life in the UK panel listing topic mastery and due dates, with a **Start due-topic review** drill that pulls questions from due topics.
- Review sessions persist as `life-uk-practice` with `practiceMode: 'life-uk-review-queue'`, update the SR schedule after each session, and show per-topic breakdown on the result view.
- Added validation markers, registry metadata (`topic spaced repetition`), and mobile smoke coverage.
- Next: mock score trend chart (shipped as Run #33) or further Life in the UK content coverage.

## Run #33 Life in the UK mock score progress trend chart

- Surfaces a **Mock score trend** card under the full timed mock area, charting recent `life-uk-full-mock` scores from learner history toward the 75% pass target.
- Full timed mocks now append to history (instead of replacing the previous full-mock entry) so multi-attempt trends, weak-topic drills, and review-queue mastery can use more evidence.
- Shows latest / best / average plus delta vs previous attempt, with pass/fail colour bars and empty-state guidance before the first mock.
- Added validation markers, registry metadata (`mock score trend chart`), and mobile smoke coverage.
- Next: expand Life in the UK explanations and topic coverage, or polish review-queue scheduling.


## Run #34 Life in the UK richer explanations + expanded topic coverage

- Strengthened teaching explanations across the existing Life in the UK bank so answers explain the civic fact, not just restate the correct option.
- Expanded the bank from 48 to 60 questions (5 per official topic) with new coverage across Government, Parliament, Law, Rights, History, UK nations, Democracy, Society, Geography, Culture, Values, and Economy.
- Updated registry/fallback metadata, validation (50+ questions, min explanation length, richer-explanations activity), and mobile smoke expectations for the larger bank.
- Next: polish review-queue scheduling, or add more Life in the UK scenario-style practice.
