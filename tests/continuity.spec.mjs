import fs from 'node:fs';
import { expect, test } from '@playwright/test';

// TFL-CONTINUITY regression suite: sw.js caches the shell, required question
// bank, manifest, registry, and shipped pack files and serves them offline;
// local history survives reload; export writes an explicit versioned JSON
// backup for the selected learner; import validates and bounds before
// restoring that selected learner; service-worker failure is non-blocking;
// and no remote sync/upload/merge/account-recovery claim is made.
// This suite runs in the mobile-chrome-continuity project where service
// workers are allowed.

const CORE_ASSETS = [
  '/index.html',
  '/questions.json',
  '/manifest.webmanifest',
  '/content-packs/registry.json',
  '/content-packs/hk-chinese-basics.json',
  '/content-packs/mandarin-basics.json',
  '/content-packs/maths-foundation.json',
  '/content-packs/life-uk.json'
];

async function waitForCoreApp(page) {
  await expect(page.getByText('LearningQuest').first()).toBeVisible();
}

async function waitForQuestionBank(page) {
  await expect(page.locator('#curriculum-grid .curriculum-title', { hasText: '11+ starter bank' })).toBeVisible({ timeout: 10000 });
}

async function waitForLifeUKPack(page) {
  await expect(page.getByRole('button', { name: 'Start 24-question full mock (45 min)' })).toBeVisible({ timeout: 10000 });
}

async function installServiceWorker(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(
    () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    { timeout: 15000 }
  ).toBeTruthy();
  await expect.poll(
    () => page.evaluate(async (assets) => {
      const keys = await caches.keys();
      const cacheName = keys.find(key => key.startsWith('learningquest-static-'));
      if (!cacheName) return false;
      const cache = await caches.open(cacheName);
      const urls = (await cache.keys()).map(request => request.url);
      return assets.every(asset => urls.some(url => url.endsWith(asset)));
    }, CORE_ASSETS),
    { timeout: 15000 }
  ).toBeTruthy();
}

test('continuity: service worker caches the shell, bank, manifest, registry, and packs and serves them offline', async ({ context, page }) => {
  await page.goto('/');
  await waitForCoreApp(page);
  await waitForQuestionBank(page);
  await waitForLifeUKPack(page);
  await installServiceWorker(page);

  // Seed one saved round so local history must survive an offline reload too.
  await page.evaluate(() => {
    localStorage.setItem('learningquest-history-v1-learner-1', JSON.stringify([{
      date: 'Seed',
      completedAt: '2026-08-20T10:00:00.000Z',
      correct: 9,
      total: 10,
      percent: 90,
      focus: 'Life in the UK',
      subjects: { 'Life in the UK': { correct: 9, total: 10 } },
      activityType: 'life-uk-practice',
      practiceMode: 'life-uk-starter',
      attempted: 10
    }]));
  });
  await page.reload();
  await waitForCoreApp(page);
  await waitForQuestionBank(page);
  await waitForLifeUKPack(page);

  await context.setOffline(true);
  await page.reload();
  await waitForCoreApp(page);
  await waitForQuestionBank(page);
  await waitForLifeUKPack(page);

  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  await expect(page.locator('#curriculum-grid .curriculum-title', { hasText: '11+ starter bank' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Life in the UK starter mock' })).toBeVisible();
  await expect(page.locator('#history-panel').getByText('Life in the UK')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1') || '[]'));
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ focus: 'Life in the UK', percent: 90, activityType: 'life-uk-practice' });
});

test('continuity: export writes an explicit versioned JSON backup for the selected learner', async ({ page }) => {
  await page.goto('/');
  await waitForCoreApp(page);

  await page.evaluate(() => {
    localStorage.setItem('learningquest-history-v1-learner-1', JSON.stringify([{
      date: 'Learner one round',
      completedAt: '2026-08-20T10:00:00.000Z',
      correct: 9,
      total: 10,
      percent: 90,
      focus: 'Life in the UK',
      subjects: { 'Life in the UK': { correct: 9, total: 10 } },
      activityType: 'life-uk-practice',
      practiceMode: 'life-uk-starter',
      attempted: 10
    }]));
    localStorage.setItem('learningquest-history-v1-learner-2', JSON.stringify([{
      date: 'Learner two round',
      completedAt: '2026-08-20T11:00:00.000Z',
      correct: 0,
      total: 6,
      percent: 0,
      focus: 'Maths Foundation answer practice',
      subjects: { 'Maths Foundation': { correct: 0, total: 6 } },
      activityType: 'maths-foundation-practice',
      practiceMode: 'maths-foundation-answer-entry',
      attempted: 1,
      skillResults: { 'Make 20': { correct: 0, attempted: 1 } },
      weakSkills: ['Make 20']
    }]));
    localStorage.setItem('learningquest-active-learner-v1', 'learner-2');
  });
  await page.reload();
  await waitForCoreApp(page);
  await expect(page.locator('#learner-note')).toContainText('Learner 2');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).tap();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^family-learning-progress-\d{4}-\d{2}-\d{2}\.json$/);

  const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(backup.app).toBe('tse-family-learning');
  expect(backup.version).toBe(2);
  expect(typeof backup.exportedAt).toBe('string');
  expect(backup.learner).toEqual({ id: 'learner-2', name: 'Learner 2' });
  expect(backup.history).toHaveLength(1);
  expect(backup.history[0]).toMatchObject({
    activityType: 'maths-foundation-practice',
    weakSkills: ['Make 20'],
    percent: 0
  });
  expect(backup.history[0].privateName).toBeUndefined();
  expect(backup.history.every(entry => !String(entry.focus || '').includes('Learner one round'))).toBeTruthy();
});

test('continuity: import validates and bounds a versioned backup before restoring the selected learner', async ({ page }) => {
  await page.goto('/');
  await waitForCoreApp(page);
  await page.getByRole('button', { name: /Learner 2/ }).tap();
  await expect(page.locator('#learner-note')).toContainText('Progress is saved separately for Learner 2');

  const backup = {
    app: 'tse-family-learning',
    version: 2,
    learner: { id: 'learner-1', name: 'Learner 1' },
    history: [
      {
        learner: 'learner-1',
        privateName: 'Do not copy',
        date: 'Imported',
        completedAt: '2026-06-09T12:00:00.000Z',
        correct: 0,
        total: 6,
        percent: 0,
        focus: 'Maths Foundation answer practice',
        subjects: { 'Maths Foundation': { correct: 0, total: 6 } },
        practiceMode: 'maths-foundation-answer-entry',
        activityType: 'maths-foundation-practice',
        attempted: 1,
        skillResults: { 'Make 20': { correct: 0, attempted: 1 } },
        weakSkills: ['Make 20'],
        rotationMode: 'maths-foundation-weak-skill-rotation'
      },
      ...Array.from({ length: 12 }, (_, index) => ({
        date: `Overflow ${index + 1}`,
        completedAt: '2026-06-09T13:00:00.000Z',
        correct: 0,
        total: 5,
        percent: 0,
        attempted: 5,
        focus: 'Overflow',
        activityType: 'question-bank-practice'
      })),
      { notGoverned: true, date: 'junk' }
    ]
  };

  const dataTransfer = await page.evaluateHandle(payload => {
    const file = new File([JSON.stringify(payload)], 'learningquest-backup.json', { type: 'application/json' });
    const data = new DataTransfer();
    data.items.add(file);
    return data;
  }, backup);
  await page.evaluate(data => {
    const input = document.getElementById('import-progress');
    input.files = data.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, dataTransfer);

  const imported = await page.evaluate(() => ({
    learner1: JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1') || '[]'),
    learner2: JSON.parse(localStorage.getItem('learningquest-history-v1-learner-2') || '[]'),
    active: localStorage.getItem('learningquest-active-learner-v1')
  }));
  expect(imported.active).toBe('learner-2');
  expect(imported.learner1).toEqual([]);
  expect(imported.learner2).toHaveLength(8);
  expect(imported.learner2.every(entry => entry.privateName === undefined && entry.learner === undefined)).toBeTruthy();
  expect(imported.learner2[0]).toMatchObject({ activityType: 'maths-foundation-practice', weakSkills: ['Make 20'] });
  expect(imported.learner2.some(entry => entry.notGoverned)).toBeFalsy();

  await expect(page.locator('#history-panel').getByText('Maths Foundation answer practice')).toBeVisible();
  await expect(page.locator('#maths-foundation-grid .maths-card').first().getByText('Weak-skill rotation: revisiting this skill from recent learner history.')).toBeVisible();
});

test('continuity: malformed or non-backup imports are rejected without corrupting local history', async ({ page }) => {
  await page.goto('/');
  await waitForCoreApp(page);
  await page.getByRole('button', { name: /Learner 2/ }).tap();
  await page.evaluate(() => {
    localStorage.setItem('learningquest-history-v1-learner-2', JSON.stringify([{
      date: 'Baseline',
      completedAt: '2026-08-20T10:00:00.000Z',
      correct: 9,
      total: 10,
      percent: 90,
      focus: 'Life in the UK',
      subjects: { 'Life in the UK': { correct: 9, total: 10 } },
      activityType: 'life-uk-practice',
      practiceMode: 'life-uk-starter',
      attempted: 10
    }]));
  });
  await page.reload();
  await waitForCoreApp(page);

  const dialogPromise = page.waitForEvent('dialog');
  const badDataTransfer = await page.evaluateHandle(() => {
    const file = new File(['{not valid json'], 'bad.json', { type: 'application/json' });
    const data = new DataTransfer();
    data.items.add(file);
    return data;
  });
  await page.evaluate(data => {
    const input = document.getElementById('import-progress');
    input.files = data.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, badDataTransfer);
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain('Could not import');
  await dialog.accept();

  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-2') || '[]'));
  expect(after).toHaveLength(1);
  expect(after[0]).toMatchObject({ focus: 'Life in the UK', percent: 90 });
});

test('continuity: service-worker failure stays non-blocking and the app works online', async ({ context, page }) => {
  await context.route('**/sw.js', route => route.fulfill({ status: 503, body: 'service worker unavailable' }));
  await page.goto('/');
  await waitForCoreApp(page);
  await waitForQuestionBank(page);
  const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
  expect(registrations).toBe(0);

  // A full question-bank round still completes online.
  const bank = await page.evaluate(async () => (await (await fetch('/questions.json')).json()).questions);
  const first = bank[0];
  await page.getByRole('button', { name: 'Start this mission' }).tap();
  await expect(page.locator('#quiz-screen')).toBeVisible();
  await expect(page.locator('#question-text')).toHaveText(first.question);
  await page.locator('#options-container .option').nth(first.answer).tap();
  await page.getByRole('button', { name: 'Submit answer' }).tap();
  await expect(page.locator('#explanation')).toHaveClass(/show/);
  await expect(page.locator(`#opt-${first.answer}`)).toHaveClass(/correct/);
});
