import fs from 'node:fs';
import vm from 'node:vm';

const requiredFiles = ['index.html', 'questions.json', 'manifest.webmanifest', 'sw.js', 'Dockerfile', 'content-packs/registry.json', 'content-packs/hk-chinese-basics.json', 'content-packs/mandarin-basics.json', 'content-packs/maths-foundation.json', 'content-packs/life-uk.json'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${file}`);
}

const html = fs.readFileSync('index.html', 'utf8');
for (const marker of [
  'LearningQuest',
  'Mobile-native learning app',
  'manifest.webmanifest',
  'serviceWorker',
  'Set up today’s mission',
  'learningquest-onboarding-v1',
  'learner-1',
  'overflow-x: hidden'
]) {
  if (!html.includes(marker)) throw new Error(`Missing app marker: ${marker}`);
}

const hardcodedPrivateNames = ['Silas', 'Sylvie', 'Kyle', 'Cheryl', 'Tse Family', '謝家'];
for (const name of hardcodedPrivateNames) {
  if (html.includes(name)) throw new Error(`Private/family-specific UI name still present in index.html: ${name}`);
}

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
if (!scriptMatch) throw new Error('Could not locate inline script');
new vm.Script(scriptMatch[1]);

// TFL-LEARNER: one browser can switch among the shipped generic learner
// profiles, choose a browser-level stage and learning goal, and see the
// active mission and recommendations update. History keys stay distinct per
// selected profile, and the shell never describes a profile as a created
// account, authenticated identity, or protected child record.
for (const marker of [
  'learningquest-active-learner-v1',
  'learningquest-onboarding-v1',
  'const LEARNERS = [',
  "id: 'learner-1'",
  "id: 'learner-2'",
  "id: 'learner-3'",
  "id: 'coach-demo'",
  'LEARNER_STAGES',
  'LEARNING_GOALS',
  'learnerHistoryKey',
  'activeLearnerId',
  'activeLearner',
  'selectLearner',
  'renderLearners',
  'renderOnboarding',
  'missionForSelection',
  'saveOnboardingState',
  'Progress is saved separately for',
  'on this browser'
]) {
  if (!html.includes(marker)) throw new Error(`Missing TFL-LEARNER marker: ${marker}`);
}
for (const forbidden of ['login', 'log in', 'log on', 'sign in', 'sign on', 'sign up', 'signup', 'password', 'create an account', 'created account', 'child account', 'protected child record', 'authenticated identity']) {
  if (new RegExp(`\\b${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(html)) {
    throw new Error(`TFL-LEARNER must not describe profiles as accounts or authenticated identities: ${forbidden}`);
  }
}

// TFL-CONTINUITY: on a browser where service-worker registration and
// installation succeed, sw.js caches the app shell, required question bank,
// manifest, registry, and shipped pack files and serves cached GETs when the
// network is unavailable. Local history survives an ordinary reload. Export
// creates an explicit versioned JSON backup for the selected learner; import
// validates and bounds its history before restoring that selected learner.
// Service-worker failure remains non-blocking online. No account recovery,
// background upload, automatic cross-device sync, merge, or
// conflict-resolution claim is made.
for (const marker of [
  'exportProgress',
  'version: 2',
  'exportedAt',
  'learner: { id: learner.id, name: learner.name }',
  'importProgress',
  'persistHistory(imported)',
  'isGovernedHistoryEntry',
  'HISTORY_LIMIT',
  'learnerHistoryKey',
  'localStorage',
  "navigator.serviceWorker.register('./sw.js')",
  'Non-blocking',
  'browser-local JSON files',
  'never uploads, syncs, merges, or recovers accounts'
]) {
  if (!html.includes(marker)) throw new Error(`Missing TFL-CONTINUITY marker: ${marker}`);
}
for (const forbidden of ['automatic cross-device sync', 'cross-device sync', 'auto-sync', 'cloud sync', 'background upload', 'account recovery', 'account-recovery', 'conflict resolution', 'automatically merge']) {
  if (html.includes(forbidden)) throw new Error(`TFL-CONTINUITY must not claim remote or automatic progress handling: ${forbidden}`);
}
const serviceWorkerSource = fs.readFileSync('sw.js', 'utf8');
for (const marker of [
  'learningquest-static-v2',
  "'./'",
  "'./index.html'",
  "'./questions.json'",
  "'./manifest.webmanifest'",
  "'./content-packs/registry.json'",
  "'./content-packs/hk-chinese-basics.json'",
  "'./content-packs/mandarin-basics.json'",
  "'./content-packs/maths-foundation.json'",
  "'./content-packs/life-uk.json'",
  "request.method !== 'GET'",
  'url.origin !== self.location.origin',
  'caches.match(request)',
  "request.mode === 'navigate'",
  'cache.addAll(CORE_ASSETS)',
  'self.skipWaiting()',
  'self.clients.claim()',
  'browser-local cache only'
]) {
  if (!serviceWorkerSource.includes(marker)) throw new Error(`Missing TFL-CONTINUITY service-worker marker: ${marker}`);
}
if (!serviceWorkerSource.includes('./content-packs/life-uk.json')) throw new Error('Service worker must cache Life in the UK content pack');

// TFL-APP: compose practice, guidance, family, and continuity into one
// mobile PWA journey. In a mobile-sized supported browser a person can open
// the LearningQuest shell without horizontal overflow, choose a generic local
// learner, stage, and goal, start an available practice, receive immediate
// feedback, observe the selected learner's saved result and next action, and
// use the honest same-browser coach and continuity paths. The manifest
// exposes the standalone PWA identity. The shell never invents a child
// account, remote progress writer, chat/social surface, or a deployed/live
// proof claim.
for (const marker of [
  'Set up today’s mission',
  'Start this mission',
  'quiz-screen',
  'results-screen',
  'history-panel',
  'next-step-panel',
  'next-step-card',
  'parent-panel',
  'leaderboard-panel',
  'import-progress',
  'exportProgress',
  'overflow-x: hidden',
  'manifest.webmanifest',
  "navigator.serviceWorker.register('./sw.js')",
  'Same-browser overview',
  'on this browser',
  'not authentication, parental authorization, or isolation',
  'not a cloud ranking or public leaderboard',
  'never uploads, syncs, merges, or recovers accounts'
]) {
  if (!html.includes(marker)) throw new Error(`Missing TFL-APP marker: ${marker}`);
}
for (const forbidden of [
  'child account',
  'create an account',
  'created account',
  'cloud sync',
  'auto-sync',
  'automatically sync',
  'background upload',
  'remote progress writer',
  'public profile',
  'social sharing',
  'social-sharing',
  'chat with',
  'chat room',
  'instant message',
  'messaging',
  'live journey',
  'deployed'
]) {
  if (html.includes(forbidden)) throw new Error(`TFL-APP must not claim an invented account, remote/chat/social surface, or deployed/live proof: ${forbidden}`);
}

function validatePackFile(path, expectedId, fields, label) {
  const pack = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (pack.id !== expectedId) throw new Error(`${label} pack id changed unexpectedly`);
  if (!pack.activity || !pack.activity.includes('matching')) throw new Error(`${label} pack metadata must advertise matching practice`);
  if (!pack.activity || !pack.activity.includes('comparison')) throw new Error(`${label} pack metadata must advertise comparison drills`);
  if (!pack.activity || !pack.activity.includes('audio prompts')) throw new Error(`${label} pack metadata must advertise audio prompts`);
  if (!Array.isArray(pack.flashcards) || pack.flashcards.length < 10) throw new Error(`${label} pack needs at least 10 flashcards`);
  for (const [i, card] of pack.flashcards.entries()) {
    for (const field of fields) {
      if (!card[field]) throw new Error(`${label} flashcard ${i + 1} missing ${field}`);
    }
  }
  return pack;
}

function validateMathsPackFile(path, expectedId, fields, label) {
  const pack = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (pack.id !== expectedId) throw new Error(`${label} pack id changed unexpectedly`);
  if (!pack.activity || !pack.activity.includes('Practice cards')) throw new Error(`${label} pack metadata must advertise practice cards`);
  if (!pack.activity || !pack.activity.includes('mental maths')) throw new Error(`${label} pack metadata must advertise mental maths`);
  if (expectedId === 'maths-foundation-v1' && !pack.activity.includes('Adaptive answer entry')) throw new Error(`${label} pack metadata must advertise adaptive answer entry`);
  if (expectedId === 'maths-foundation-v1' && !pack.activity.includes('Number-line models')) throw new Error(`${label} pack metadata must advertise number-line models`);
  if (expectedId === 'maths-foundation-v1' && !pack.activity.includes('weak-skill rotation')) throw new Error(`${label} pack metadata must advertise weak-skill rotation`);
  if (!Array.isArray(pack.practiceCards) || pack.practiceCards.length < 10) throw new Error(`${label} pack needs at least 10 practice cards`);
  for (const [i, card] of pack.practiceCards.entries()) {
    for (const field of fields) {
      if (!card[field]) throw new Error(`${label} practice card ${i + 1} missing ${field}`);
    }
  }
  return pack;
}


function validateLifeUKPackFile(path, expectedId, fields, label) {
  const pack = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (pack.id !== expectedId) throw new Error(`${label} pack id changed unexpectedly`);
  if (!pack.activity || !pack.activity.includes('Practice questions')) throw new Error(`${label} pack metadata must advertise practice questions`);
  if (!pack.activity || !pack.activity.includes('expanded question bank')) throw new Error(`${label} pack metadata must advertise expanded question bank`);
  if (!pack.activity || !pack.activity.includes('richer explanations')) throw new Error(`${label} pack metadata must advertise richer explanations`);
  if (!pack.activity || !pack.activity.includes('starter mock mode')) throw new Error(`${label} pack metadata must advertise starter mock mode`);
  if (!pack.activity || !pack.activity.includes('weak-topic review')) throw new Error(`${label} pack metadata must advertise weak-topic review`);
  if (!pack.activity || !pack.activity.includes('full timed mock')) throw new Error(`${label} pack metadata must advertise a full timed mock`);
  if (!pack.activity || !pack.activity.includes('adaptive weak-topic drill')) throw new Error(`${label} pack metadata must advertise an adaptive weak-topic drill`);
  if (!pack.progressionSteps.includes('Run adaptive weak-topic drills from saved mock review data')) throw new Error(`${label} pack missing adaptive drill progression step`);
  if (!pack.mock || Number(pack.mock.passMarkPercent) !== 75) throw new Error(`${label} pack must declare a 75% pass mark`);
  if (!pack.mock || Number(pack.mock.timeLimitMinutes) !== 45) throw new Error(`${label} pack must declare the 45-minute mock target`);
  if (!Array.isArray(pack.questions) || pack.questions.length < 50) throw new Error(`${label} pack needs at least 50 questions`);
  const topicCounts = {};
  const prompts = new Set();
  for (const [i, question] of pack.questions.entries()) {
    for (const field of fields) {
      if (question[field] === undefined || question[field] === null || question[field] === '') throw new Error(`${label} question ${i + 1} missing ${field}`);
    }
    if (!Array.isArray(question.options) || question.options.length < 4) throw new Error(`${label} question ${i + 1} needs at least four options`);
    if (!Number.isInteger(Number(question.answer)) || Number(question.answer) < 0 || Number(question.answer) >= question.options.length) throw new Error(`${label} question ${i + 1} has invalid answer`);
    if (prompts.has(question.prompt)) throw new Error(`${label} duplicate prompt: ${question.prompt}`);
    prompts.add(question.prompt);
    topicCounts[question.topic] = (topicCounts[question.topic] || 0) + 1;
  }
  const undercoveredTopics = Object.entries(topicCounts).filter(([, count]) => count < 4);
  if (undercoveredTopics.length) throw new Error(`${label} topics need at least four questions: ${undercoveredTopics.map(([topic, count]) => `${topic} (${count})`).join(', ')}`);
  const shortExplanations = pack.questions
    .map((question, index) => ({ index: index + 1, topic: question.topic, length: String(question.explanation || '').trim().length, prompt: question.prompt }))
    .filter(item => item.length < 70);
  if (shortExplanations.length) {
    throw new Error(`${label} explanations must teach the fact (min 70 chars): ${shortExplanations.slice(0, 5).map(item => `#${item.index} ${item.topic} (${item.length})`).join(', ')}`);
  }
  if (!pack.activity || !pack.activity.includes('richer explanations')) throw new Error(`${label} pack metadata must advertise richer explanations`);
  if (!pack.activity || !pack.activity.includes('scenario-style practice')) throw new Error(`${label} pack metadata must advertise scenario-style practice`);
  if (!pack.progressionSteps.includes('Practise real-life citizenship scenarios drawn from everyday UK situations')) throw new Error(`${label} pack missing scenario-style progression step`);
  const scenarioQuestions = pack.questions.filter(question => question && (question.style === 'scenario' || question.scenario));
  if (scenarioQuestions.length < 12) throw new Error(`${label} pack needs at least 12 scenario-style questions`);
  for (const [i, question] of scenarioQuestions.entries()) {
    if (!question.scenario || String(question.scenario).trim().length < 24) throw new Error(`${label} scenario question ${i + 1} needs a situation stem`);
    if (question.style && question.style !== 'scenario') throw new Error(`${label} scenario question ${i + 1} has unexpected style`);
  }
  return pack;
}

const registry = JSON.parse(fs.readFileSync('content-packs/registry.json', 'utf8'));
if (registry.id !== 'learningquest-content-pack-registry-v1') throw new Error('Content pack registry id changed unexpectedly');
if (!Array.isArray(registry.packs) || registry.packs.length < 4) throw new Error('Content pack registry needs at least four packs');
const registryById = Object.fromEntries(registry.packs.map(pack => [pack.id, pack]));
for (const [id, path, fields] of [
  ['hk-chinese-basics-v1', 'content-packs/hk-chinese-basics.json', ['traditional', 'jyutping', 'canto', 'english', 'prompt']],
  ['mandarin-basics-v1', 'content-packs/mandarin-basics.json', ['simplified', 'traditional', 'pinyin', 'english', 'prompt']],
  ['maths-foundation-v1', 'content-packs/maths-foundation.json', ['topic', 'skill', 'prompt', 'answer', 'strategy']],
  ['life-uk-v1', 'content-packs/life-uk.json', ['topic', 'prompt', 'options', 'answer', 'explanation']]
]) {
  const registered = registryById[id];
  if (!registered) throw new Error(`Content pack registry missing ${id}`);
  if (registered.path !== path) throw new Error(`Content pack registry path mismatch for ${id}`);
  if (!Array.isArray(registered.schema) || fields.some(field => !registered.schema.includes(field))) throw new Error(`Content pack registry schema mismatch for ${id}`);
  if (registered.readiness === 'Planned') throw new Error(`Content pack registry ${id} is a planned label without valid pack data`);
  for (const field of ['kind', 'title', 'domain', 'language', 'learners', 'activity', 'readiness', 'next', 'renderTarget']) {
    if (!registered[field]) throw new Error(`Content pack registry ${id} missing ${field}`);
  }
  for (const field of ['recommendedStages', 'recommendedGoals']) {
    if (!Array.isArray(registered[field]) || !registered[field].length) throw new Error(`Content pack registry ${id} missing ${field}`);
  }
  if (id === 'maths-foundation-v1') {
    if (registered.kind !== 'practice-cards') throw new Error('Content pack registry maths-foundation-v1 must use practice-cards kind');
    if (!registered.activity.includes('Practice cards')) throw new Error('Content pack registry maths-foundation-v1 missing practice-card activity');
    if (!registered.activity.includes('mental maths')) throw new Error('Content pack registry maths-foundation-v1 missing mental maths activity');
    if (!registered.activity.includes('Adaptive answer entry')) throw new Error('Content pack registry maths-foundation-v1 missing adaptive answer-entry activity');
    if (!registered.activity.includes('Number-line models')) throw new Error('Content pack registry maths-foundation-v1 missing number-line model activity');
    if (!registered.activity.includes('weak-skill rotation')) throw new Error('Content pack registry maths-foundation-v1 missing weak-skill rotation activity');
    if (!registered.progressionSteps.includes('Type answers and unlock strategy feedback')) throw new Error('Content pack registry maths-foundation-v1 missing answer-entry progression step');
    if (!registered.progressionSteps.includes('Review weak skills first with number-line support')) throw new Error('Content pack registry maths-foundation-v1 missing weak-skill rotation progression step');
  } else if (id === 'life-uk-v1') {
    if (registered.kind !== 'mock-questions') throw new Error('Content pack registry life-uk-v1 must use mock-questions kind');
    if (!registered.activity.includes('Practice questions')) throw new Error('Content pack registry life-uk-v1 missing practice-question activity');
    if (!registered.activity.includes('expanded question bank')) throw new Error('Content pack registry life-uk-v1 missing expanded question bank activity');
    if (!registered.activity.includes('shuffled selection')) throw new Error('Content pack registry life-uk-v1 missing shuffled selection activity');
    if (!registered.activity.includes('starter mock mode')) throw new Error('Content pack registry life-uk-v1 missing starter mock mode activity');
    if (!registered.activity.includes('weak-topic review')) throw new Error('Content pack registry life-uk-v1 missing weak-topic review activity');
    if (!registered.progressionSteps.includes('Build toward a 24-question, 45-minute mock test from an expanded bank')) throw new Error('Content pack registry life-uk-v1 missing expanded timed-mock progression step');
    if (!registered.activity.includes('full timed mock')) throw new Error('Content pack registry life-uk-v1 missing full timed mock activity');
    if (!registered.activity.includes('adaptive weak-topic drill')) throw new Error('Content pack registry life-uk-v1 missing adaptive weak-topic drill activity');
    if (!registered.progressionSteps.includes('Run adaptive weak-topic drills from saved mock review data')) throw new Error('Content pack registry life-uk-v1 missing adaptive drill progression step');
    if (!registered.activity.includes('topic spaced repetition')) throw new Error('Content pack registry life-uk-v1 missing topic spaced repetition activity');
    if (!registered.progressionSteps.includes('Use the review queue to revisit due citizenship topics from saved mastery')) throw new Error('Content pack registry life-uk-v1 missing review queue progression step');
    if (!registered.activity.includes('polished review-queue scheduling')) throw new Error('Content pack registry life-uk-v1 missing polished review-queue scheduling activity');
    if (!registered.progressionSteps.includes('Follow polished due/overdue review-queue scheduling for citizenship topics')) throw new Error('Content pack registry life-uk-v1 missing polished review-queue scheduling progression step');
    if (!registered.activity.includes('mock score trend chart')) throw new Error('Content pack registry life-uk-v1 missing mock score trend chart activity');
    if (!registered.progressionSteps.includes('Track full-mock score trends toward the 75% pass target')) throw new Error('Content pack registry life-uk-v1 missing mock score trend progression step');
    if (!registered.activity.includes('richer explanations')) throw new Error('Content pack registry life-uk-v1 missing richer explanations activity');
    if (!registered.progressionSteps.includes('Study clearer explanations after each answer to lock in citizenship facts')) throw new Error('Content pack registry life-uk-v1 missing clearer-explanations progression step');
    if (!registered.activity.includes('scenario-style practice')) throw new Error('Content pack registry life-uk-v1 missing scenario-style practice activity');
    if (!registered.progressionSteps.includes('Practise real-life citizenship scenarios drawn from everyday UK situations')) throw new Error('Content pack registry life-uk-v1 missing scenario-style progression step');
  } else {
    if (!registered.activity.includes('matching')) throw new Error(`Content pack registry ${id} missing matching activity`);
    if (!registered.activity.includes('comparison')) throw new Error(`Content pack registry ${id} missing comparison activity`);
    if (!registered.activity.includes('audio prompts')) throw new Error(`Content pack registry ${id} missing audio prompt activity`);
  }
  if (!Array.isArray(registered.progressionSteps) || registered.progressionSteps.length < 3) throw new Error(`Content pack registry ${id} missing progressionSteps`);
}
const hkChinesePack = validatePackFile('content-packs/hk-chinese-basics.json', 'hk-chinese-basics-v1', registryById['hk-chinese-basics-v1'].schema, 'HK Chinese');
const mandarinPack = validatePackFile('content-packs/mandarin-basics.json', 'mandarin-basics-v1', registryById['mandarin-basics-v1'].schema, 'Mandarin');
const mathsFoundationPack = validateMathsPackFile('content-packs/maths-foundation.json', 'maths-foundation-v1', registryById['maths-foundation-v1'].schema, 'Maths Foundation');
const lifeUKPack = validateLifeUKPackFile('content-packs/life-uk.json', 'life-uk-v1', registryById['life-uk-v1'].schema, 'Life in the UK');
for (const marker of [
  'liveLearningDomains',
  'contentPackPath',
  'contentPackDefinition',
  'curriculumCatalog',
  'validateContentPackRegistry',
  'loadContentPackRegistry',
  'renderCurriculumPacks',
  'content-packs/registry.json',
  'Number bonds',
  'Maths Foundation practice cards',
  'validateMathsFoundationPack',
  'loadMathsFoundationPack',
  'mathsFoundationTopics',
  'mathsFoundationCardCount',
  'mathsFoundationCards',
  'maths-foundation-grid',
  'maths-foundation-v1',
  'renderMathsFoundationPractice',
  'Type your answer to unlock the strategy',
  'mathsFoundationPracticeScores',
  'mathsFoundationPracticeSummary',
  'recordMathsFoundationAnswer',
  'maths-foundation-answer-entry',
  'latestMathsFoundationProgress',
  'cleanHistoryEntry',
  'restoreProgressRuntimeState',
  'passMark',
  'passed',
  'mathsNumberLineVisual',
  'maths-number-line',
  'mathsFoundationWeakSkillSet',
  'mathsFoundationWeakSkills',
  'mathsFoundationRotationMode',
  'maths-foundation-weak-skill-rotation',
  'MATHS_FOUNDATION_PRACTICE_LIMIT',
  'renderChineseMatchingPractice',
  'matchingPracticeCounts',
  'renderChineseComparisonDrill',
  'comparisonDrillCards',
  'comparisonDrillPairs',
  'comparison-card',
  'comparison-grid',
  'audio-button',
  'speakChinesePrompt',
  'speechSynthesisAvailable',
  'SpeechSynthesisUtterance',
  'audioPromptCards',
  'audioPromptCounts',
  'audioPromptLocales',
  'audioVoiceHint',
  'audioVoiceHints',
  'audioPromptReplayCounts',
  'audioPromptSlowReplayCounts',
  'audioPromptRates',
  'audioPromptRate',
  'audioPromptModeLabel',
  'audio-actions',
  'audio-slow-button',
  'Slow repeat',
  'data-audio-played',
  'Replay ready',
  'audio-voice-hint',
  'latestAudioPrompt',
  'zh-HK',
  'zh-CN',
  'Hear Cantonese',
  'Hear Mandarin',
  'matchingPracticeSummary',
  'matchingPracticeScores',
  'recordMatchingAnswer',
  'matchingPracticeMeta',
  'matching-practice',
  'latestMatchingProgress',
  'upsertHistoryEntry',
  'saveMatchingPracticeProgress',
  'Traditional HK Chinese matching practice',
  'Simplified Mandarin matching practice',
  'recommendCurriculumPacks',
  'recommendedCurriculumTitles',
  'packHistoryInsight',
  'historyAwareCurriculumInsights',
  'historyRecommendationScores',
  'packIsAvailable',
  'openRecommendedPractice',
  'nextStepRecommendation',
  'recommendedEvidence',
  'parentNextStepAction',
  'parentCoachActions',
  'startCoachAction',
  'familyLearnerRows',
  'familyComparisonRows',
  'familyCoachFollowUp',
  'switchedBeforeOpen',
  'family-action-title',
  'family-action-evidence',
  'Same-browser overview',
  'Local learner comparison',
  'not authentication, parental authorization, or isolation',
  'not uploaded automatically',
  'not a cloud ranking or public leaderboard',
  'Saved local history for',
  'from local history',
  'Evidence:',
  'Baseline',
  'No saved practice',
  'Recent Maths Foundation practice flagged',
  'saved learner history',
  'loadHKChinesePack',
  'loadMandarinPack',
  'validateHKChinesePack',
  'validateMandarinPack',
  'hkChineseFlashcards',
  'mandarinFlashcards',
  'hkChinesePackError',
  'mandarinPackError',
  'flashcard-placeholder',
  'life-uk-v1',
  'Life in the UK starter mock',
  'renderLifeUKPractice',
  'validateLifeUKPack',
  'loadLifeUKPack',
  'lifeUKPracticeScores',
  'lifeUKPracticeSummary',
  'recordLifeUKAnswer',
  'life-uk-practice',
  'latestLifeUKProgress',
  'lifeUKWeakTopics',
  '75% pass target',
  'expanded question bank',
  'lifeUKShuffledQuestions',
  'lifeUKFullMockSelectedQuestions',
  'weak-topic review',
  'Question practice remains available',
  'full timed mock',
  'life-uk-mock-start',
  'startLifeUKFullMock',
  'renderLifeUKFullMock',
  'recordLifeUKMockAnswer',
  'finishLifeUKFullMock',
  'lifeUKMockState',
  'lifeUKMockSelectedAnswers',
  'LIFE_UK_FULL_MOCK_QUESTION_COUNT',
  'LIFE_UK_FULL_MOCK_TIME_LIMIT_SECONDS',
  'Start 24-question full mock (45 min)',
  'life-uk-mock-area',
  'life-uk-full-mock',
  'life-uk-drill-actions',
  'life-uk-drill-area',
  'life-uk-drill-start',
  'renderLifeUKDrill',
  'startLifeUKDrill',
  'lifeUKDrillState',
  'lifeUKDrillPoolSize',
  'life-uk-weak-topic-drill',
  'LIFE_UK_DRILL_QUESTION_COUNT',
  'life-uk-topic-breakdown',
  'lifeUKTopicBreakdownHtml',
  'lifeUKTopicBreakdownRows',
  'Per-topic breakdown',
  'life-uk-review-queue-area',
  'life-uk-review-queue',
  'lifeUKReviewQueueRows',
  'lifeUKMergeTopicSRFromHistory',
  'lifeUKReviewQueueScheduleSummary',
  'lifeUKReviewQueuePriorityScore',
  'lifeUKReviewQueueScheduleStatus',
  'lifeUKReviewQueueRelativeDueLabel',
  'life-uk-review-queue',
  'LIFE_UK_REVIEW_QUEUE_QUESTION_COUNT',
  'LIFE_UK_SR_MAX_INTERVAL_DAYS',
  'startLifeUKReviewQueueDrill',
  'renderLifeUKReviewQueue',
  'Review queue · polished topic scheduling',
  'Priority now:',
  'life-uk-review-queue-summary',
  'life-uk-review-queue-chip',
  'life-uk-review-queue-status-pill',
  'life-uk-mock-score-trend-area',
  'life-uk-mock-score-trend',
  'lifeUKMockScoreTrendRows',
  'lifeUKMockScoreTrendHtml',
  'renderLifeUKMockScoreTrend',
  'LIFE_UK_MOCK_SCORE_TREND_LIMIT',
  'mock score trend chart',
  'Mock score trend',
  'scenario-style practice',
  'life-uk-scenario-area',
  'life-uk-scenario-actions',
  'life-uk-scenario-start',
  'life-uk-scenario-grid',
  'life-uk-scenario-card',
  'life-uk-scenario-story',
  'startLifeUKScenarioPractice',
  'renderLifeUKScenarioPractice',
  'recordLifeUKScenarioAnswer',
  'finishLifeUKScenarioPractice',
  'saveLifeUKScenarioProgress',
  'lifeUKScenarioQuestions',
  'lifeUKScenarioState',
  'LIFE_UK_SCENARIO_QUESTION_COUNT',
  'life-uk-scenario-practice',
  'Start scenario-style practice',
  'submitSelectedAnswer',
  'quizAdvance',
  'matchingCardAnswer',
  'question-bank-practice',
  'Submit answer',
  'updateQuestionBankTestState',
  'quizAnswersLocked',
  'HISTORY_LIMIT',
  'persistHistory',
  'isGovernedHistoryEntry',
  'resetProgressRuntimeState',
  'activeLearnerHistoryKey'
]) {
  if (!html.includes(marker)) throw new Error(`Missing runtime HK Chinese content-pack marker: ${marker}`);
}
for (const inlineSeed of ['baa4 baa1', 'zou2 san4', 'bàba', 'zǎoshang hǎo', 'Find something red nearby']) {
  if (html.includes(inlineSeed)) throw new Error(`HK Chinese flashcards should be runtime-loaded from JSON, not inline seeded: ${inlineSeed}`);
}

for (const forbidden of [
  'FALLBACK_CONTENT_PACK_REGISTRY',
  'french-planned',
  'French first phrases',
  "status: 'Planned'",
  "state: 'planned'",
  "readiness: 'Planned'",
  'Primary Learning',
  'English Mastery'
]) {
  if (html.includes(forbidden)) throw new Error(`Planned domain/card or inline second copy of governed pack data still present: ${forbidden}`);
}

for (const path of [
  'content-packs/hk-chinese-basics.json',
  'content-packs/mandarin-basics.json',
  'content-packs/maths-foundation.json',
  'content-packs/life-uk.json'
]) {
  if (html.includes(path)) throw new Error(`Content pack path must be resolved from the registry only, not inlined in the shell: ${path}`);
}

const data = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
if (!data.meta || !Array.isArray(data.questions)) throw new Error('questions.json must contain meta and questions[]');
if (data.meta.questionCount !== data.questions.length) throw new Error(`questionCount ${data.meta.questionCount} != ${data.questions.length}`);
if (data.questions.length < 20) throw new Error('Expected at least 20 starter questions');
for (const [i, q] of data.questions.entries()) {
  for (const field of ['id', 'subject', 'question', 'options', 'answer', 'explanation']) {
    if (!(field in q)) throw new Error(`Question ${i + 1} missing ${field}`);
  }
  if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`Question ${q.id} has invalid options`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) throw new Error(`Question ${q.id} has invalid answer index`);
}

// TFL-APP: manifest.webmanifest exposes the standalone PWA identity.
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
for (const field of ['name', 'short_name', 'description', 'start_url', 'scope', 'display', 'background_color', 'theme_color', 'orientation', 'categories', 'lang']) {
  if (!manifest[field]) throw new Error(`PWA manifest missing ${field}`);
}
if (manifest.display !== 'standalone') throw new Error('PWA manifest must use standalone display');
if (manifest.orientation !== 'portrait-primary') throw new Error('PWA manifest must declare portrait-primary orientation');
if (!Array.isArray(manifest.categories) || !manifest.categories.includes('education')) throw new Error('PWA manifest must declare the education category');

console.log(`Validated LearningQuest static app with ${data.questions.length} questions.`);

const serverLog = fs.readFileSync('server.js', 'utf8');
if (serverLog.includes('Tse Family')) throw new Error('server.js still contains legacy family-specific branding');
if (!serverLog.includes('LearningQuest running on port')) throw new Error('server.js missing LearningQuest startup marker');

const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
if (!dockerfile.includes('COPY content-packs ./content-packs')) throw new Error('Dockerfile must publish content-packs for production');
void hkChinesePack;
void mandarinPack;
void mathsFoundationPack;
void lifeUKPack;
