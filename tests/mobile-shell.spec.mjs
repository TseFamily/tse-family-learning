import { expect, test } from '@playwright/test';

async function waitForQuestionBank(page) {
  await page.waitForFunction(
    () => Number(window.__learningQuestTestState?.practiceQuestionBankCount || 0) >= 20,
    null,
    { timeout: 10000 }
  );
}

async function loadQuestionBank(page) {
  return page.evaluate(async () => {
    const response = await fetch('/questions.json');
    return response.json();
  });
}

function filteredBank(bank, subject, difficulty, skill) {
  return bank.questions.filter(question => {
    const subjectMatch = subject === 'Mixed' || question.subject === subject;
    const difficultyMatch = difficulty === 'All' || question.difficulty === difficulty;
    const skillMatch = skill === 'All' || question.skill === skill;
    return subjectMatch && difficultyMatch && skillMatch;
  });
}

async function completeLockedQuestion(page, question, { probeUnlock = false } = {}) {
  await expect(page.locator('#question-text')).toHaveText(question.question);
  const options = page.locator('#options-container .option');
  await expect(options).toHaveCount(question.options.length);
  await expect(page.locator('#explanation')).not.toHaveClass(/show/);
  await expect(page.getByRole('button', { name: 'Submit answer' })).toBeDisabled();
  expect(await options.evaluateAll(els => els.every(el => !el.classList.contains('locked') && !el.classList.contains('correct') && !el.classList.contains('wrong')))).toBeTruthy();
  expect(await options.evaluateAll(els => els.every(el => !el.hasAttribute('data-expected') && el.getAttribute('data-correct') == null))).toBeTruthy();

  const wrongIndex = question.options.findIndex((_, index) => index !== question.answer);
  if (probeUnlock && wrongIndex >= 0) {
    await options.nth(wrongIndex).tap();
    await expect(options.nth(wrongIndex)).toHaveClass(/selected/);
    await expect(page.locator('#explanation')).not.toHaveClass(/show/);
    expect(await page.evaluate(() => window.__learningQuestTestState.quizAnswersLocked)).toBeFalsy();
    await expect(page.getByRole('button', { name: 'Submit answer' })).toBeEnabled();
  }

  await options.nth(question.answer).tap();
  await expect(options.nth(question.answer)).toHaveClass(/selected/);
  await expect(page.locator('#explanation')).not.toHaveClass(/show/);
  expect(await options.evaluateAll(els => els.every(el => !el.classList.contains('correct') && !el.classList.contains('wrong') && !el.classList.contains('locked')))).toBeTruthy();
  await page.getByRole('button', { name: 'Submit answer' }).tap();

  await expect(page.locator('#explanation')).toHaveClass(/show/);
  await expect(page.locator('#explanation')).toContainText(question.explanation);
  await expect(page.locator(`#opt-${question.answer}`)).toHaveClass(/correct/);
  await expect(page.locator(`#opt-${question.answer}`)).toHaveClass(/locked/);
  expect(await page.evaluate(() => window.__learningQuestTestState.quizAnswersLocked)).toBeTruthy();

  const submitted = question.answer;
  await page.evaluate(index => selectOption(index), submitted === 0 ? 1 : 0);
  expect(await page.evaluate(() => window.__learningQuestTestState.quizSelectedOption)).toBe(submitted);
  expect(await page.evaluate(() => window.__learningQuestTestState.quizAnswersLocked)).toBeTruthy();
}


test('mobile app shell opens without horizontal overflow and mission onboarding works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set up today’s mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build confidence' })).toBeVisible();

  await page.getByRole('button', { name: 'Exam prep' }).tap();
  await page.getByRole('button', { name: 'Get exam-ready' }).tap();
  await expect(page.getByText('Exam mode: Exam prep')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start this mission' })).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended .curriculum-title', { hasText: '11+ starter bank' })).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Best match for exam prep from the live question bank.').first()).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Start with a mixed diagnostic round → Focus quick practice on weak skills → Return to timed exam-prep missions').first()).toBeVisible();

  await page.getByRole('button', { name: 'Adult' }).tap();
  await page.getByRole('button', { name: 'Learn language' }).tap();
  await expect(page.getByText('Listen & recall: Adult')).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended .curriculum-title', { hasText: 'Simplified Mandarin basics' })).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Adult language goal match from the runtime content-pack registry.').first()).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Start with greetings and core family words → Compare Simplified, Traditional, and Pinyin forms → Use matching practice and comparison drills, then try audio prompts').first()).toBeVisible();
  await page.getByRole('button', { name: 'Get exam-ready' }).tap();
  await expect(page.locator('.curriculum-card.recommended .curriculum-title', { hasText: 'Life in the UK starter mock' })).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Adult learning match for bite-sized recall.').first()).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Start with civic basics and everyday UK facts → Study clearer explanations after each answer to lock in citizenship facts → Practise weak citizenship topics from saved attempts → Build toward a 24-question, 45-minute mock test from an expanded bank').first()).toBeVisible();
  await page.getByRole('button', { name: 'Learn language' }).tap();
  await expect(page.locator('#flashcard-grid .flashcard-term', { hasText: '早晨' })).toBeVisible();
  await expect(page.locator('#flashcard-grid .flashcard-term', { hasText: '紅色' })).toBeVisible();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard-term', { hasText: '早上好' })).toBeVisible();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard-term', { hasText: '红色' })).toBeVisible();
  await expect(page.locator('#flashcard-grid .flashcard').first().getByRole('button', { name: 'Hear Cantonese' })).toBeVisible();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard').first().getByRole('button', { name: 'Hear Mandarin' })).toBeVisible();
  const firstCantoneseCard = page.locator('#flashcard-grid .flashcard').first();
  await expect(firstCantoneseCard.locator('.audio-voice-hint')).toContainText(/tap once, then replay to practise|Voice fallback/);
  await expect(firstCantoneseCard.getByRole('button', { name: 'Slow repeat' })).toBeVisible();
  await firstCantoneseCard.getByRole('button', { name: 'Hear Cantonese' }).tap();
  await expect(firstCantoneseCard.getByRole('button', { name: 'Replay Cantonese audio prompt' })).toBeVisible();
  await expect(firstCantoneseCard.locator('.audio-status')).toContainText(/Replay ready|Audio support unavailable/);
  await firstCantoneseCard.getByRole('button', { name: 'Replay Cantonese audio prompt' }).tap();
  await expect(firstCantoneseCard.locator('.audio-status')).toContainText(/2 listens|2 total cues/);
  await firstCantoneseCard.getByRole('button', { name: 'Slow repeat Cantonese audio prompt' }).tap();
  await expect(firstCantoneseCard.getByRole('button', { name: 'Slow repeat Cantonese audio prompt' })).toHaveText(/Slow repeat again/);
  await expect(firstCantoneseCard.locator('.audio-status')).toContainText(/Slow repeat|slow replay cue saved/);
  await expect(page.getByRole('heading', { name: 'Traditional HK Chinese matching practice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Simplified Mandarin matching practice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Traditional/Simplified comparison drill' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Maths Foundation practice cards' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Life in the UK starter mock' })).toBeVisible();
  await expect(page.locator('#life-uk-grid .life-uk-card').first().getByText('Government')).toBeVisible();
  await expect(page.locator('#life-uk-grid .life-uk-card').first().getByText('Who appoints the Prime Minister after a general election?')).toBeVisible();
  const lifeUKCard = page.locator('#life-uk-grid .life-uk-card').first();
  await lifeUKCard.getByRole('button', { name: 'The Speaker' }).tap();
  await expect(lifeUKCard.getByText('Try again in review — this topic is now flagged.')).toBeVisible();
  await expect(lifeUKCard.getByText('0/6 correct · 0% · 75% pass target')).toBeVisible();
  await expect(lifeUKCard.getByText('Explanation: The monarch appoints as Prime Minister')).toBeVisible();
  await expect(page.locator('#history-panel').getByText('Life in the UK starter mock')).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Number bonds · Make 10')).toBeVisible();
  const makeTenCard = page.locator('#maths-foundation-grid .maths-card', { hasText: 'What number goes with 6 to make 10?' });
  await expect(makeTenCard.getByRole('textbox', { name: 'Answer for What number goes with 6 to make 10?' })).toBeVisible();
  await expect(makeTenCard.getByText('Strategy locked until this answer is correct.')).toBeVisible();
  await makeTenCard.getByRole('textbox', { name: 'Answer for What number goes with 6 to make 10?' }).fill('4');
  await makeTenCard.getByRole('button', { name: 'Check answer' }).tap();
  await expect(makeTenCard.getByText('✅ Correct — strategy unlocked.')).toBeVisible();
  await expect(makeTenCard.getByText('1/6 solved · 1 tried')).toBeVisible();
  await expect(makeTenCard.getByText('6 + 4 = 10')).toBeVisible();
  await expect(makeTenCard.locator('.maths-number-line')).toBeVisible();
  await expect(makeTenCard.getByText('Count up from 6: 7, 8, 9, 10. That is 4 steps.')).toBeVisible();
  await expect(page.locator('#history-panel').getByText('Maths Foundation answer practice')).toBeVisible();
  await expect(page.locator('#parent-panel').getByText('Next: Review Government')).toBeVisible();
  await expect(page.locator('#parent-panel').getByText('Recent practice flagged Government for coach follow-up.')).toBeVisible();
  const twoTimesCard = page.locator('#maths-foundation-grid .maths-card', { hasText: 'What is 2 × 6?' });
  await twoTimesCard.getByRole('textbox', { name: 'Answer for What is 2 × 6?' }).fill('12');
  await twoTimesCard.getByRole('button', { name: 'Check answer' }).tap();
  await expect(twoTimesCard.getByText('✅ Correct — strategy unlocked.')).toBeVisible();
  await expect(twoTimesCard.getByText('Double 6 to make 12.')).toBeVisible();
  await expect(page.locator('#comparison-grid .comparison-card').first().getByText('Traditional HK')).toBeVisible();
  await expect(page.locator('#comparison-grid .comparison-card').first().getByText('Simplified Mandarin')).toBeVisible();
  await expect(page.locator('#comparison-grid .comparison-card', { hasText: '爸爸' }).getByText('Same written form — pronunciation changes.')).toBeVisible();
  await expect(page.locator('#comparison-grid .comparison-card', { hasText: '媽媽' }).getByText('妈妈')).toBeVisible();
  await expect(page.locator('#comparison-grid .comparison-card', { hasText: '紅色' }).getByText('红色')).toBeVisible();
  await expect(page.locator('#hk-matching-grid .matching-card').first().getByText('Dad / father')).toBeVisible();
  await expect(page.locator('#mandarin-matching-grid .matching-card').first().getByText('bàba')).toBeVisible();
  await expect(page.locator('#hk-matching-grid .matching-card').first().getByText('Tap the meaning that matches this term.')).toBeVisible();
  await page.locator('#hk-matching-grid .matching-card').first().getByRole('button', { name: 'Dad / father' }).tap();
  await expect(page.locator('#hk-matching-grid .matching-card').first().getByText('✅ Matched')).toBeVisible();
  await expect(page.locator('#hk-matching-grid .matching-card').first().getByText('1/4 matched · 1 tried')).toBeVisible();
  await expect(page.locator('#history-panel').getByText('Traditional HK Chinese matching')).toBeVisible();
  await page.locator('#mandarin-matching-grid .matching-card').first().getByRole('button', { name: 'Dad / father' }).tap();
  await expect(page.locator('#mandarin-matching-grid .matching-card').first().getByText('✅ Matched')).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.contentPackRegistryCount).toBeGreaterThanOrEqual(4);
  expect(state.contentPackRegistryError).toBeNull();
  expect(state.hkChinesePackId).toBe('hk-chinese-basics-v1');
  expect(state.mandarinPackId).toBe('mandarin-basics-v1');
  expect(state.mathsFoundationPackId).toBe('maths-foundation-v1');
  expect(state.lifeUKPackId).toBe('life-uk-v1');
  expect(state.lifeUKQuestionCount).toBe(72);
  expect(state.lifeUKPracticeCount).toBe(6);
  expect(state.lifeUKPassMark).toBe(75);
  expect(state.lifeUKTopics).toEqual(expect.arrayContaining(['Government', 'Parliament', 'Law']));
  expect(state.lifeUKPracticeScores).toEqual({ correct: 0, attempted: 1, total: 6, percent: 0, passMark: 75, passed: false });
  expect(state.lifeUKWeakTopics).toContain('Government');
  expect(state.latestLifeUKProgress).toMatchObject({
    activityType: 'life-uk-practice',
    practiceMode: 'life-uk-starter-mock',
    correct: 0,
    total: 6,
    percent: 0,
    attempted: 1,
    weakSkills: ['Government']
  });
  expect(state.mathsFoundationCardCount).toBe(10);
  expect(state.mathsFoundationTopics).toEqual(expect.arrayContaining(['Number bonds', 'Place value', 'Times tables']));
  expect(state.recommendedCurriculumTitles).toContain('Life in the UK starter mock');
  expect(state.recommendedProgressionPaths.join(' | ')).toContain('Build toward a 24-question, 45-minute mock test');

  await page.getByRole('button', { name: 'Primary' }).tap();
  await page.getByRole('button', { name: 'Build confidence' }).tap();
  await expect(page.locator('.curriculum-card.recommended .curriculum-title', { hasText: 'Maths Foundation practice' })).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Maths Foundation is at 33% in saved learner history.').first()).toBeVisible();
  await expect(page.locator('.curriculum-card.recommended').getByText('Start with number bonds to 10 and 20 → Practise place value and skip counting → Move into times tables, fractions, and short word problems → Type answers and unlock strategy feedback').first()).toBeVisible();
  const primaryState = await page.evaluate(() => window.__learningQuestTestState);
  expect(primaryState.recommendedCurriculumTitles).toContain('Maths Foundation practice');
  expect(primaryState.historyAwareCurriculumInsights).toContain('Maths Foundation is at 33% in saved learner history.');
  expect(primaryState.historyRecommendationScores).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: 'Maths Foundation practice', score: 6 })
  ]));
  expect(primaryState.parentCoachActions).toEqual(expect.arrayContaining([
    expect.objectContaining({ learner: 'Learner 1', title: 'Review Government', subject: 'Life in the UK', priority: 'weak-skill' })
  ]));
  expect(state.matchingPracticeCounts).toEqual({ hkChinese: 4, mandarin: 4 });
  expect(state.audioPromptCounts).toEqual({ hkChinese: 5, mandarin: 5 });
  expect(state.audioPromptLocales).toEqual(['zh-HK', 'zh-CN']);
  expect(state.audioVoiceHints.hkChinese).toMatch(/zh-HK|Voice fallback/);
  expect(state.audioPromptReplayCounts['zh-HK:爸爸']).toBe(3);
  expect(state.audioPromptSlowReplayCounts['zh-HK:爸爸']).toBe(1);
  expect(state.audioPromptRates['zh-HK:爸爸']).toBe(0.62);
  expect(state.latestAudioPrompt).toMatchObject({ text: '爸爸', lang: 'zh-HK', label: 'Cantonese audio prompt', replayCount: 3, slowReplayCount: 1, mode: 'slow', rate: 0.62 });
  expect(state.comparisonDrillPairs).toHaveLength(6);
  expect(state.comparisonDrillPairs).toEqual(expect.arrayContaining([
    expect.objectContaining({ traditional: '媽媽', simplified: '妈妈', english: 'Mum / mother', changed: true })
  ]));
  expect(state.mathsFoundationPracticeScores).toEqual({ correct: 2, attempted: 2, total: 6 });
  expect(state.mathsFoundationNumberLineCount).toBeGreaterThanOrEqual(6);
  expect(state.mathsFoundationRotationMode).toBe('New skills first');
  expect(state.latestMathsFoundationProgress).toMatchObject({
    activityType: 'maths-foundation-practice',
    practiceMode: 'maths-foundation-answer-entry',
    correct: 2,
    total: 6,
    percent: 33,
    attempted: 2,
    rotationMode: 'maths-foundation-weak-skill-rotation'
  });
  expect(state.latestMathsFoundationProgress.skillResults).toMatchObject({
    'Make 10': { correct: 1, attempted: 1 },
    '2 times table': { correct: 1, attempted: 1 }
  });
  expect(state.matchingPracticeScores.hkChinese).toEqual({ correct: 1, attempted: 1, total: 4 });
  expect(state.matchingPracticeScores.mandarin).toEqual({ correct: 1, attempted: 1, total: 4 });
  expect(state.latestMatchingProgress).toMatchObject({
    activityType: 'matching-practice',
    matchingPackKey: 'mandarin',
    practiceMode: 'matching-practice',
    correct: 1,
    total: 4,
    percent: 25,
    attempted: 1
  });
  const savedHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1')));
  expect(savedHistory[0]).toMatchObject({ activityType: 'matching-practice', matchingPackKey: 'mandarin', correct: 1, total: 4, percent: 25 });
  expect(savedHistory).toEqual(expect.arrayContaining([
    expect.objectContaining({ activityType: 'life-uk-practice', correct: 0, total: 6, percent: 0, weakSkills: ['Government'] }),
    expect.objectContaining({ activityType: 'maths-foundation-practice', correct: 2, total: 6, percent: 33 }),
    expect.objectContaining({ activityType: 'matching-practice', matchingPackKey: 'hkChinese', correct: 1, total: 4, percent: 25 })
  ]));

  const makeTwentyCard = page.locator('#maths-foundation-grid .maths-card', { hasText: 'What number goes with 13 to make 20?' });
  await makeTwentyCard.getByRole('textbox', { name: 'Answer for What number goes with 13 to make 20?' }).fill('6');
  await makeTwentyCard.getByRole('button', { name: 'Check answer' }).tap();
  await expect(makeTwentyCard.getByText('Try again')).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Weak-skill rotation: revisiting this skill from recent learner history.')).toBeVisible();
  await expect(page.locator('#parent-panel').getByText('Next: Review Make 20')).toBeVisible();
  await expect(page.locator('#parent-panel').getByText('Recent practice flagged Make 20 for coach follow-up.')).toBeVisible();
  const rotationState = await page.evaluate(() => window.__learningQuestTestState);
  expect(rotationState.mathsFoundationWeakSkills).toContain('Make 20');
  expect(rotationState.mathsFoundationRotationMode).toBe('Weak-skill rotation active');
  expect(rotationState.latestMathsFoundationProgress.weakSkills).toContain('Make 20');
  expect(rotationState.parentCoachActions).toEqual(expect.arrayContaining([
    expect.objectContaining({ learner: 'Learner 1', title: 'Review Make 20', priority: 'weak-skill' })
  ]));

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});


test('progress import restores adaptive activity metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Number bonds · Make 10')).toBeVisible();

  const adaptiveBackup = {
    app: 'tse-family-learning',
    version: 2,
    history: [
      {
        learner: 'learner-1',
        date: 'Imported',
        completedAt: '2026-06-09T12:00:00.000Z',
        correct: 0,
        total: 6,
        percent: 0,
        focus: 'Maths Foundation answer practice',
        subjects: { 'Maths Foundation': { correct: 0, total: 6 } },
        practiceMode: 'maths-foundation-answer-entry',
        difficultyMode: 'maths-foundation',
        activityType: 'maths-foundation-practice',
        attempted: 1,
        skillResults: { 'Make 20': { correct: 0, attempted: 1 } },
        weakSkills: ['Make 20'],
        rotationMode: 'maths-foundation-weak-skill-rotation'
      },
      {
        learner: 'learner-1',
        date: 'Imported',
        completedAt: '2026-06-09T12:00:30.000Z',
        correct: 0,
        total: 6,
        percent: 0,
        focus: 'Life in the UK starter mock',
        subjects: { 'Life in the UK': { correct: 0, total: 6 } },
        practiceMode: 'life-uk-starter-mock',
        difficultyMode: 'citizenship-starter',
        activityType: 'life-uk-practice',
        attempted: 1,
        skillResults: { Government: { correct: 0, attempted: 1 } },
        weakSkills: ['Government']
      },
      {
        learner: 'learner-1',
        date: 'Imported',
        completedAt: '2026-06-09T12:01:00.000Z',
        correct: 1,
        total: 4,
        percent: 25,
        focus: 'Simplified Mandarin matching',
        subjects: { 'Chinese · Simplified Mandarin': { correct: 1, total: 4 } },
        practiceMode: 'matching-practice',
        difficultyMode: 'mandarin',
        activityType: 'matching-practice',
        matchingPackKey: 'mandarin',
        attempted: 1
      }
    ]
  };
  const dataTransfer = await page.evaluateHandle((payload) => {
    const file = new File([JSON.stringify(payload)], 'learningquest-backup.json', { type: 'application/json' });
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt;
  }, adaptiveBackup);
  await page.evaluate((dt) => {
    const input = document.getElementById('import-progress');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, dataTransfer);
  await expect(page.locator('#history-panel').getByText('Maths Foundation answer practice')).toBeVisible();
  await expect(page.locator('#history-panel').getByText('Simplified Mandarin matching')).toBeVisible();
  await expect(page.locator('#history-panel').getByText('Life in the UK starter mock')).toBeVisible();
  await expect(page.locator('#mandarin-matching-grid .matching-card').first().getByText('1/4 matched · 1 tried')).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first()).toContainText('What number goes with 13 to make 20?');
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Weak-skill rotation: revisiting this skill from recent learner history.')).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.mathsFoundationWeakSkills).toContain('Make 20');
  expect(state.mathsFoundationRotationMode).toBe('Weak-skill rotation active');
  expect(state.matchingPracticeScores.mandarin).toEqual({ correct: 1, attempted: 1, total: 4 });
  expect(state.lifeUKWeakTopics).toContain('Government');
  expect(state.latestLifeUKProgress).toMatchObject({ activityType: 'life-uk-practice', weakSkills: ['Government'] });
  expect(state.recommendedCurriculumTitles).toContain('Maths Foundation practice');
  expect(state.historyAwareCurriculumInsights).toContain('Recent Maths Foundation practice flagged Make 20 for review.');
  expect(state.historyRecommendationScores).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: 'Maths Foundation practice', score: 8 })
  ]));
  expect(state.parentCoachActions).toEqual(expect.arrayContaining([
    expect.objectContaining({ learner: 'Learner 1', title: 'Review Make 20', subject: 'Maths Foundation', priority: 'weak-skill' })
  ]));
  expect(state.latestMathsFoundationProgress).toMatchObject({
    activityType: 'maths-foundation-practice',
    weakSkills: ['Make 20'],
    rotationMode: 'maths-foundation-weak-skill-rotation'
  });

  const restoredHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1')));
  expect(restoredHistory).toEqual(expect.arrayContaining([
    expect.objectContaining({ activityType: 'maths-foundation-practice', weakSkills: ['Make 20'], skillResults: { 'Make 20': { correct: 0, attempted: 1 } } }),
    expect.objectContaining({ activityType: 'matching-practice', matchingPackKey: 'mandarin', attempted: 1 }),
    expect.objectContaining({ activityType: 'life-uk-practice', weakSkills: ['Government'], skillResults: { Government: { correct: 0, attempted: 1 } } })
  ]));
});

test('question practice remains available when optional HK Chinese pack is unavailable', async ({ page }) => {
  await page.route('**/content-packs/hk-chinese-basics.json*', route => route.fulfill({ status: 503, body: 'pack unavailable' }));
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set up today’s mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start this mission' })).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.hkChinesePackError,
    null,
    { timeout: 10000 }
  );
  await expect(page.locator('#flashcard-grid .flashcard-placeholder').getByText('Question practice remains available')).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.hkChinesePackId).toBeNull();
  expect(state.hkChinesePackError).toContain('content-packs/hk-chinese-basics.json');
});

test('question practice remains available when optional Mandarin pack is unavailable', async ({ page }) => {
  await page.route('**/content-packs/mandarin-basics.json*', route => route.fulfill({ status: 503, body: 'pack unavailable' }));
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set up today’s mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start this mission' })).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.mandarinPackError,
    null,
    { timeout: 10000 }
  );
  await expect(page.locator('#mandarin-flashcard-grid .flashcard-placeholder').getByText('Question practice remains available')).toBeVisible();
  await expect(page.locator('#flashcard-grid .flashcard-term', { hasText: '早晨' })).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.hkChinesePackId).toBe('hk-chinese-basics-v1');
  expect(state.mandarinPackId).toBeNull();
  expect(state.mandarinPackError).toContain('content-packs/mandarin-basics.json');
});

test('question practice remains available when optional Maths Foundation pack is unavailable', async ({ page }) => {
  await page.route('**/content-packs/maths-foundation.json*', route => route.fulfill({ status: 503, body: 'pack unavailable' }));
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set up today’s mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start this mission' })).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.mathsFoundationPackError,
    null,
    { timeout: 10000 }
  );
  await expect(page.locator('#maths-foundation-grid .maths-card').getByText('Try quiz practice while this pack recovers.')).toBeVisible();
  await expect(page.locator('#flashcard-grid .flashcard-term', { hasText: '早晨' })).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.mathsFoundationPackId).toBeNull();
  expect(state.mathsFoundationPackError).toContain('content-packs/maths-foundation.json');
  expect(state.hkChinesePackId).toBe('hk-chinese-basics-v1');
  expect(state.mandarinPackId).toBe('mandarin-basics-v1');
});


test('question practice remains available when optional Life in the UK pack is unavailable', async ({ page }) => {
  await page.route('**/content-packs/life-uk.json*', route => route.fulfill({ status: 503, body: 'pack unavailable' }));
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Set up today’s mission' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start this mission' })).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackError,
    null,
    { timeout: 10000 }
  );
  await expect(page.locator('#life-uk-grid .life-uk-card').getByText('Use the other practice packs while this mock recovers.')).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Number bonds · Make 10')).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.lifeUKPackId).toBeNull();
  expect(state.lifeUKPackError).toContain('content-packs/life-uk.json');
  expect(state.mathsFoundationPackId).toBe('maths-foundation-v1');
});

test('registered content packs fall back when registry is unavailable', async ({ page }) => {
  await page.route('**/content-packs/registry.json*', route => route.fulfill({ status: 503, body: 'registry unavailable' }));
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await expect(page.locator('#flashcard-grid .flashcard-term', { hasText: '早晨' })).toBeVisible();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard-term', { hasText: '早上好' })).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Number bonds · Make 10')).toBeVisible();
  await expect(page.locator('#life-uk-grid .life-uk-card').first().getByText('Who appoints the Prime Minister after a general election?')).toBeVisible();

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.contentPackRegistryCount).toBeGreaterThanOrEqual(4);
  expect(state.contentPackRegistryError).toContain('content-packs/registry.json');
  expect(state.hkChinesePackId).toBe('hk-chinese-basics-v1');
  expect(state.mandarinPackId).toBe('mandarin-basics-v1');
  expect(state.mathsFoundationPackId).toBe('maths-foundation-v1');
  expect(state.lifeUKPackId).toBe('life-uk-v1');
});

test('Life in the UK full timed mock renders, scores answers, and records progress', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  await expect(page.getByRole('button', { name: 'Start 24-question full mock (45 min)' })).toBeVisible();
  await page.evaluate(() => { Math.random = () => 0.999999; });
  await page.getByRole('button', { name: 'Start 24-question full mock (45 min)' }).tap();

  await expect(page.locator('#life-uk-mock-area')).toBeVisible();
  await expect(page.locator('#life-uk-mock-grid .life-uk-mock-card').first().getByText('Government')).toBeVisible();
  await expect(page.locator('#life-uk-mock-grid .life-uk-mock-card').first().getByText('Who appoints the Prime Minister after a general election?')).toBeVisible();
  await expect(page.locator('.life-uk-mock-timer')).toContainText(/\d{2}:\d{2}/);
  await expect(page.locator('.life-uk-mock-status')).toContainText('Answered 0/24');

  const firstMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').first();
  await firstMockCard.getByRole('button', { name: 'The monarch' }).tap();
  await expect(firstMockCard.getByText('✅ Correct.')).toBeVisible();
  await expect(page.locator('.life-uk-mock-status')).toContainText('Answered 1/24');
  await expect(page.locator('.life-uk-mock-status')).toContainText('Correct 1');

  const secondMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').nth(1);
  await secondMockCard.getByRole('button', { name: 'House of Lords' }).tap();
  await expect(secondMockCard.getByText('Noted — review this after the mock.')).toBeVisible();

  await page.getByRole('button', { name: 'Finish mock early' }).tap();
  await expect(page.locator('.life-uk-mock-result')).toBeVisible();
  await expect(page.locator('.life-uk-mock-result h4')).toContainText(/Full timed mock complete/);
  await expect(page.locator('#life-uk-mock-area')).toContainText('1/24 correct');
  await expect(page.locator('#life-uk-mock-area')).toContainText('75% pass target');
  await expect(page.locator('.life-uk-mock-review-item').first()).toContainText('Q1.');

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.lifeUKFullMockReady).toBe(true);
  expect(state.lifeUKFullMockAvailableQuestions).toBe(72);
  expect(state.lifeUKFullMockSelectedQuestions).toBe(24);
  expect(state.lifeUKFullMockQuestionCount).toBe(24);
  expect(state.lifeUKFullMockTimeLimitSeconds).toBe(45 * 60);
  expect(state.latestLifeUKMockProgress).toMatchObject({
    activityType: 'life-uk-practice',
    practiceMode: 'life-uk-full-mock',
    correct: 1,
    total: 24,
    attempted: 2,
    timedMock: true
  });
  expect(state.latestLifeUKMockProgress.passed).toBe(false);
  expect(state.latestLifeUKMockProgress.weakSkills).toContain('Parliament');
  expect(state.latestLifeUKMockProgress.skillResults).toMatchObject({ Parliament: { correct: 0, attempted: 1 } });
  await expect(page.locator('.life-uk-topic-breakdown')).toBeVisible();
  await expect(page.locator('.life-uk-topic-breakdown')).toContainText('Per-topic breakdown');
  await expect(page.locator('.life-uk-topic-breakdown')).toContainText('Parliament');
});

test('Life in the UK adaptive weak-topic drill pulls from full-mock weak skills and persists progress', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  await expect(page.getByRole('button', { name: 'Start 24-question full mock (45 min)' })).toBeVisible();
  await page.evaluate(() => { Math.random = () => 0.999999; });
  await page.getByRole('button', { name: 'Start 24-question full mock (45 min)' }).tap();

  await expect(page.locator('#life-uk-mock-area')).toBeVisible();

  const firstMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').first();
  await firstMockCard.getByRole('button', { name: 'The monarch' }).tap();

  const secondMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').nth(1);
  await secondMockCard.getByRole('button', { name: 'House of Lords' }).tap();

  await page.getByRole('button', { name: 'Finish mock early' }).tap();
  await expect(page.locator('.life-uk-mock-result')).toBeVisible();

  await expect(page.locator('.life-uk-drill-start')).toBeVisible();
  const drillLabel = await page.locator('.life-uk-drill-start').first().textContent();
  expect(drillLabel || '').toMatch(/Start weak-topic drill|Start adaptive drill/);
  await page.locator('.life-uk-drill-start').first().tap();

  await expect(page.locator('#life-uk-drill-area')).toBeVisible();
  await expect(page.locator('.life-uk-drill-status')).toContainText(/Drill Q\d+\/\d+/);
  await expect(page.locator('.life-uk-drill-grid .life-uk-drill-card').first()).toBeVisible();
  await expect(page.locator('.life-uk-drill-grid .life-uk-drill-card').first().getByText(/Full-mock review|History review/)).toBeVisible();

  const drillCards = page.locator('.life-uk-drill-grid .life-uk-drill-card');
  const count = await drillCards.count();
  for (let i = 0; i < count; i += 1) {
    const card = drillCards.nth(i);
    await card.locator('.life-uk-option').first().tap();
  }

  await expect(page.locator('.life-uk-drill-result')).toBeVisible();
  await expect(page.locator('.life-uk-drill-result h4')).toContainText(/Adaptive weak-topic drill complete/);
  await expect(page.locator('.life-uk-drill-result')).toContainText(/75% pass target/);

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.lifeUKWeakTopicDrillReady).toBe(true);
  expect(state.lifeUKDrillQuestionCount).toBe(6);
  expect(state.lifeUKDrillPoolSize).toBeGreaterThan(0);
  expect(state.lifeUKDrillPoolSize).toBeLessThanOrEqual(6);
  expect(state.lifeUKDrillSourcePoolCount).toBe(72);
  expect(state.lifeUKDrillSources).toEqual(expect.arrayContaining(['Full-mock review']));
  expect(state.latestLifeUKDrillProgress).toMatchObject({
    activityType: 'life-uk-practice',
    practiceMode: 'life-uk-weak-topic-drill',
    timedMock: false,
    difficultyMode: 'weak-topic-drill'
  });
  expect(state.latestLifeUKDrillProgress.drillSources).toEqual(expect.arrayContaining(['Full-mock review']));
  expect(state.latestLifeUKDrillProgress.skillResults).toBeDefined();
  expect(Object.keys(state.latestLifeUKDrillProgress.skillResults).length).toBeGreaterThan(0);
  await expect(page.locator('.life-uk-drill-result .life-uk-topic-breakdown')).toBeVisible();
  await expect(page.locator('.life-uk-drill-result .life-uk-topic-breakdown')).toContainText('Per-topic breakdown');
});

test('Life in the UK review queue aggregates mastery and drills due topics', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  await page.evaluate(() => { Math.random = () => 0.999999; });
  await page.getByRole('button', { name: 'Start 24-question full mock (45 min)' }).tap();
  await expect(page.locator('#life-uk-mock-area')).toBeVisible();

  const firstMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').first();
  await firstMockCard.getByRole('button', { name: 'The monarch' }).tap();
  const secondMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').nth(1);
  await secondMockCard.getByRole('button', { name: 'House of Lords' }).tap();
  await page.getByRole('button', { name: 'Finish mock early' }).tap();
  await expect(page.locator('.life-uk-mock-result')).toBeVisible();

  await expect(page.locator('.life-uk-review-queue-card')).toBeVisible();
  await expect(page.locator('.life-uk-review-queue-card')).toContainText('Review queue');
  await expect(page.locator('.life-uk-review-queue-card')).toContainText('polished topic scheduling');
  await expect(page.locator('.life-uk-review-queue-summary')).toBeVisible();
  await expect(page.locator('.life-uk-review-queue-start')).toBeVisible();

  const stateBefore = await page.evaluate(() => window.__learningQuestTestState);
  expect(stateBefore.lifeUKReviewQueueDueCount).toBeGreaterThan(0);
  expect(stateBefore.lifeUKReviewQueueDueTopics.length).toBeGreaterThan(0);
  expect(stateBefore.lifeUKReviewQueueScheduleSummary.dueCount).toBeGreaterThan(0);
  expect(stateBefore.lifeUKReviewQueueScheduleVersion).toBe('polished-v1');
  expect(stateBefore.lifeUKReviewQueueMaxIntervalDays).toBe(21);

  await page.locator('.life-uk-review-queue-start').tap();
  await expect(page.locator('#life-uk-review-queue-grid .life-uk-drill-card').first()).toBeVisible();

  const reviewCards = page.locator('#life-uk-review-queue-grid .life-uk-drill-card');
  const count = await reviewCards.count();
  for (let i = 0; i < count; i += 1) {
    await reviewCards.nth(i).locator('.life-uk-option').first().tap();
  }

  await expect(page.locator('#life-uk-review-queue-area .life-uk-drill-result h4')).toContainText(/Review queue drill complete/);
  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.latestLifeUKReviewQueueProgress).toMatchObject({
    activityType: 'life-uk-practice',
    practiceMode: 'life-uk-review-queue',
    difficultyMode: 'topic-spaced-repetition'
  });
  expect(state.latestLifeUKReviewQueueProgress.skillResults).toBeDefined();
  await expect(page.locator('#life-uk-review-queue-area .life-uk-drill-result .life-uk-topic-breakdown')).toContainText('Per-topic breakdown');
});

test('Life in the UK mock score trend chart renders from saved full mocks', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  // Seed two prior full mocks so the chart has multi-attempt history, then finish one live mock.
  await page.evaluate(() => {
    const key = 'learningquest-history-v1-learner-1';
    const seeded = [
      {
        learner: 'learner-1',
        date: 'Jul 20',
        completedAt: '2026-07-20T10:00:00.000Z',
        correct: 12,
        total: 24,
        percent: 50,
        focus: 'Life in the UK full timed mock',
        subjects: { 'Life in the UK': { correct: 12, total: 24 } },
        practiceMode: 'life-uk-full-mock',
        difficultyMode: 'timed-mock',
        activityType: 'life-uk-practice',
        attempted: 24,
        passMark: 75,
        passed: false,
        skillResults: { Government: { correct: 1, attempted: 2 } },
        weakSkills: ['Government'],
        timedMock: true,
        timeExpired: false
      },
      {
        learner: 'learner-1',
        date: 'Jul 22',
        completedAt: '2026-07-22T10:00:00.000Z',
        correct: 16,
        total: 24,
        percent: 67,
        focus: 'Life in the UK full timed mock',
        subjects: { 'Life in the UK': { correct: 16, total: 24 } },
        practiceMode: 'life-uk-full-mock',
        difficultyMode: 'timed-mock',
        activityType: 'life-uk-practice',
        attempted: 24,
        passMark: 75,
        passed: false,
        skillResults: { Parliament: { correct: 1, attempted: 2 } },
        weakSkills: ['Parliament'],
        timedMock: true,
        timeExpired: false
      }
    ];
    localStorage.setItem(key, JSON.stringify(seeded));
  });
  await page.reload();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  await expect(page.locator('#life-uk-mock-score-trend-area .life-uk-mock-score-trend-card')).toBeVisible();
  await expect(page.locator('#life-uk-mock-score-trend-area')).toContainText('Mock score trend');
  await expect(page.locator('#life-uk-mock-score-trend-area')).toContainText('Pass target 75%');
  await expect(page.locator('.life-uk-mock-score-trend-chart .life-uk-mock-score-trend-bar-wrap')).toHaveCount(2);

  const stateBefore = await page.evaluate(() => window.__learningQuestTestState);
  expect(stateBefore.lifeUKMockScoreTrendCount).toBe(2);
  expect(stateBefore.lifeUKMockScoreTrendRows.map(row => row.percent)).toEqual([50, 67]);

  await page.evaluate(() => { Math.random = () => 0.999999; });
  await page.getByRole('button', { name: 'Start 24-question full mock (45 min)' }).tap();
  await expect(page.locator('#life-uk-mock-area')).toBeVisible();
  const firstMockCard = page.locator('#life-uk-mock-grid .life-uk-mock-card').first();
  await firstMockCard.getByRole('button', { name: 'The monarch' }).tap();
  await page.getByRole('button', { name: 'Finish mock early' }).tap();
  await expect(page.locator('.life-uk-mock-result')).toBeVisible();

  await expect(page.locator('.life-uk-mock-score-trend-chart .life-uk-mock-score-trend-bar-wrap')).toHaveCount(3);
  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.lifeUKMockScoreTrendCount).toBe(3);
  expect(state.lifeUKMockScoreTrendRows[2].percent).toBeGreaterThanOrEqual(0);
  await expect(page.locator('#life-uk-mock-score-trend-area')).toContainText(/pts vs previous|unchanged vs previous|first saved full mock/);
});

test('Life in the UK review-queue schedule polish prioritises overdue and weak topics', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  await page.evaluate(() => {
    const historyKey = 'learningquest-history-v1-learner-1';
    const srKey = 'learningquest-life-uk-topic-sr-v1-learner-1';
    const history = [
      {
        learner: 'learner-1',
        date: 'Jul 20',
        completedAt: '2026-07-20T10:00:00.000Z',
        correct: 10,
        total: 24,
        percent: 42,
        focus: 'Life in the UK full timed mock',
        subjects: { 'Life in the UK': { correct: 10, total: 24 } },
        practiceMode: 'life-uk-full-mock',
        difficultyMode: 'timed-mock',
        activityType: 'life-uk-practice',
        attempted: 24,
        passMark: 75,
        passed: false,
        skillResults: {
          Government: { correct: 0, attempted: 2 },
          History: { correct: 2, attempted: 2 },
          Law: { correct: 1, attempted: 2 },
          Parliament: { correct: 2, attempted: 2 }
        },
        weakSkills: ['Government', 'Law'],
        timedMock: true,
        timeExpired: false
      }
    ];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const sr = {
      Government: {
        topic: 'Government',
        easeFactor: 2.1,
        intervalDays: 1,
        repetitions: 0,
        dueAt: new Date(now - 3 * day).toISOString(),
        lastReviewedAt: new Date(now - 4 * day).toISOString(),
        historyCorrect: 0,
        historyAttempted: 2,
        historyPercent: 0
      },
      History: {
        topic: 'History',
        easeFactor: 2.6,
        intervalDays: 7,
        repetitions: 2,
        dueAt: new Date(now + 5 * day).toISOString(),
        lastReviewedAt: new Date(now - 2 * day).toISOString(),
        historyCorrect: 2,
        historyAttempted: 2,
        historyPercent: 100
      },
      Law: {
        topic: 'Law',
        easeFactor: 2.3,
        intervalDays: 3,
        repetitions: 1,
        dueAt: new Date(now + 2 * day).toISOString(),
        lastReviewedAt: new Date(now - 1 * day).toISOString(),
        historyCorrect: 1,
        historyAttempted: 2,
        historyPercent: 50
      },
      Parliament: {
        topic: 'Parliament',
        easeFactor: 2.5,
        intervalDays: 4,
        repetitions: 2,
        dueAt: new Date(now + 1 * day).toISOString(),
        lastReviewedAt: new Date(now - 1 * day).toISOString(),
        historyCorrect: 2,
        historyAttempted: 2,
        historyPercent: 100
      }
    };
    localStorage.setItem(historyKey, JSON.stringify(history));
    localStorage.setItem(srKey, JSON.stringify(sr));
  });

  await page.reload();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKReviewQueueScheduleVersion === 'polished-v1',
    null,
    { timeout: 10000 }
  );

  await expect(page.locator('.life-uk-review-queue-card')).toContainText('polished topic scheduling');
  await expect(page.locator('.life-uk-review-queue-summary')).toContainText('overdue');
  await expect(page.locator('.life-uk-review-queue-card')).toContainText('Priority now:');

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.lifeUKReviewQueueDueTopics[0]).toBe('Government');
  expect(state.lifeUKReviewQueueDueTopics).toContain('Law');
  expect(state.lifeUKReviewQueueScheduleSummary.overdue).toBeGreaterThan(0);
  expect(state.lifeUKReviewQueueScheduleSummary.dueCount).toBeGreaterThan(0);
  expect(state.lifeUKReviewQueueRows[0].status).toMatch(/overdue|weak-forced|due-today/);
  expect(state.lifeUKReviewQueueRows.some(row => row.topic === 'Government' && row.due)).toBeTruthy();

  await page.locator('.life-uk-review-queue-start').tap();
  await expect(page.locator('#life-uk-review-queue-grid .life-uk-drill-card').first()).toBeVisible();
  await expect(page.locator('#life-uk-review-queue-grid')).toContainText('Government');
});

test('Life in the UK scenario-style practice renders situations, scores answers, and persists progress', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(
    () => window.__learningQuestTestState?.lifeUKPackId === 'life-uk-v1',
    null,
    { timeout: 10000 }
  );

  const before = await page.evaluate(() => window.__learningQuestTestState);
  expect(before.lifeUKScenarioAvailableCount).toBeGreaterThanOrEqual(12);
  expect(before.lifeUKScenarioQuestionCount).toBe(6);

  await expect(page.locator('#life-uk-scenario-actions .life-uk-scenario-start')).toBeVisible();
  await page.locator('.life-uk-scenario-start').tap();
  await expect(page.locator('#life-uk-scenario-grid .life-uk-scenario-card').first()).toBeVisible();
  await expect(page.locator('#life-uk-scenario-grid .life-uk-scenario-story').first()).toBeVisible();

  const cards = page.locator('#life-uk-scenario-grid .life-uk-scenario-card');
  const count = await cards.count();
  expect(count).toBe(6);

  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const buttons = card.locator('button.life-uk-option');
    await buttons.first().tap();
  }

  await expect(page.locator('.life-uk-scenario-result')).toBeVisible();
  await expect(page.locator('.life-uk-scenario-result')).toContainText('Scenario practice complete');

  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.lifeUKScenarioState?.finished).toBeTruthy();
  expect(state.latestLifeUKScenarioProgress?.practiceMode).toBe('life-uk-scenario-practice');
  expect(state.latestLifeUKScenarioProgress?.activityType).toBe('life-uk-practice');
  expect(state.latestLifeUKScenarioProgress?.scenarioStyle).toBeTruthy();
  expect(state.latestLifeUKScenarioProgress?.total).toBe(6);
  expect(Object.keys(state.latestLifeUKScenarioProgress?.skillResults || {}).length).toBeGreaterThan(0);
});



test('required question bank supports filtered timed MCQs with locked answers, explanations, results, and review', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await waitForQuestionBank(page);

  const bank = await loadQuestionBank(page);
  expect(bank.questions.length).toBe(28);
  await expect(page.locator('#practice-options').getByRole('button', { name: 'Mixed (28)' })).toBeVisible();
  await expect(page.locator('#practice-note')).toHaveText('Mixed practice uses all 28 questions.');

  await page.locator('#practice-options').getByRole('button', { name: 'Phonics (5)' }).tap();
  await page.locator('#difficulty-options').getByRole('button', { name: 'Foundation (12)' }).tap();
  await page.locator('#skill-options').getByRole('button', { name: 'Sound patterns (5)' }).tap();
  await expect(page.locator('#practice-note')).toHaveText('Phonics · Foundation · Sound patterns practice uses 3 focused questions.');

  const expectedQuestions = filteredBank(bank, 'Phonics', 'Foundation', 'Sound patterns');
  expect(expectedQuestions).toHaveLength(3);
  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.practiceFilters).toEqual({ subject: 'Phonics', difficulty: 'Foundation', skill: 'Sound patterns' });
  expect(state.practiceActiveCount).toBe(3);
  expect(state.quizTimed).toBeTruthy();

  await page.getByRole('button', { name: 'Start this mission' }).tap();
  await expect(page.locator('#quiz-screen')).toBeVisible();
  await expect(page.locator('#timer')).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator('#q-counter')).toHaveText('Question 1 of 3');

  for (let index = 0; index < expectedQuestions.length; index += 1) {
    await completeLockedQuestion(page, expectedQuestions[index], { probeUnlock: index === 0 });
    const last = index === expectedQuestions.length - 1;
    await page.getByRole('button', { name: last ? 'Finish' : 'Next →' }).tap();
  }

  await expect(page.locator('#results-screen')).toBeVisible();
  await expect(page.locator('#score-num')).toHaveText('3');
  await expect(page.locator('#score-total')).toHaveText('3');
  await expect(page.locator('#review-list')).toContainText('Question Review');
  for (const question of expectedQuestions) {
    await expect(page.locator('#review-list')).toContainText(question.question);
    await expect(page.locator('#review-list')).toContainText(question.options[question.answer]);
  }

  const resultState = await page.evaluate(() => window.__learningQuestTestState);
  expect(resultState.latestQuestionBankProgress).toMatchObject({
    activityType: 'question-bank-practice',
    practiceMode: 'Phonics',
    difficultyMode: 'Foundation',
    skillMode: 'Sound patterns',
    timed: true,
    correct: 3,
    total: 3,
    percent: 100
  });
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1')));
  expect(history[0]).toMatchObject({
    activityType: 'question-bank-practice',
    practiceMode: 'Phonics',
    difficultyMode: 'Foundation',
    skillMode: 'Sound patterns',
    timed: true,
    correct: 3,
    total: 3
  });
});

test('matching practice does not expose answers before submit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#hk-matching-grid .matching-card').first()).toBeVisible();
  const firstCard = page.locator('#hk-matching-grid .matching-card').first();
  await expect(firstCard.getByText('Tap the meaning that matches this term.')).toBeVisible();
  const leaked = await firstCard.locator('.matching-option').evaluateAll(els => els.map(el => ({
    expected: el.getAttribute('data-expected'),
    correct: el.getAttribute('data-correct')
  })));
  expect(leaked.every(item => item.expected == null && item.correct == null)).toBeTruthy();
  await expect(firstCard).not.toContainText('Correct answer:');
  await expect(firstCard.locator('.matching-option.correct')).toHaveCount(0);

  await firstCard.getByRole('button', { name: 'Dad / father' }).tap();
  await expect(firstCard.getByText('✅ Matched')).toBeVisible();
  await expect(firstCard.locator('.matching-option').first()).toBeDisabled();
});

test('browser speech and placeholder cards do not count as completed practice', async ({ page }) => {
  await page.route('**/content-packs/hk-chinese-basics.json*', route => route.fulfill({ status: 503, body: 'pack unavailable' }));
  await page.goto('/');
  await expect(page.getByText('LearningQuest').first()).toBeVisible();
  await page.waitForFunction(() => window.__learningQuestTestState?.hkChinesePackError, null, { timeout: 10000 });
  await expect(page.locator('#flashcard-grid .flashcard-placeholder').getByText('Question practice remains available')).toBeVisible();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard').first().getByRole('button', { name: 'Hear Mandarin' })).toBeVisible();

  await page.locator('#mandarin-flashcard-grid .flashcard').first().getByRole('button', { name: 'Hear Mandarin' }).tap();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard').first().locator('.audio-status')).toContainText(/Replay ready|Audio support unavailable/);

  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1') || '[]'));
  expect(history).toEqual([]);
  const state = await page.evaluate(() => window.__learningQuestTestState);
  expect(state.latestQuestionBankProgress || null).toBeNull();
  expect(state.latestAudioPrompt?.supported === true || state.latestAudioPrompt?.supported === false).toBeTruthy();
});

test('question bank practice still completes when an optional pack is missing', async ({ page }) => {
  await page.route('**/content-packs/hk-chinese-basics.json*', route => route.fulfill({ status: 503, body: 'pack unavailable' }));
  await page.goto('/');
  await waitForQuestionBank(page);
  await expect(page.locator('#flashcard-grid .flashcard-placeholder').getByText('Question practice remains available')).toBeVisible();
  await expect(page.locator('#mandarin-flashcard-grid .flashcard-term', { hasText: '早上好' })).toBeVisible();

  const bank = await loadQuestionBank(page);
  await page.locator('#practice-options').getByRole('button', { name: 'Phonics (5)' }).tap();
  await page.locator('#difficulty-options').getByRole('button', { name: 'Foundation (12)' }).tap();
  await page.locator('#skill-options').getByRole('button', { name: 'Sound patterns (5)' }).tap();
  const expectedQuestions = filteredBank(bank, 'Phonics', 'Foundation', 'Sound patterns');
  await page.getByRole('button', { name: 'Start this mission' }).tap();
  await expect(page.locator('#quiz-screen')).toBeVisible();
  for (let index = 0; index < expectedQuestions.length; index += 1) {
    await completeLockedQuestion(page, expectedQuestions[index]);
    const last = index === expectedQuestions.length - 1;
    await page.getByRole('button', { name: last ? 'Finish' : 'Next →' }).tap();
  }
  await expect(page.locator('#results-screen')).toBeVisible();
  await expect(page.locator('#score-num')).toHaveText('3');
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1')));
  expect(history[0]).toMatchObject({ activityType: 'question-bank-practice', total: 3, correct: 3 });
});
