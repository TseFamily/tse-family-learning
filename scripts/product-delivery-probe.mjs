import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

export const contractId = 'tse-family-learning.browser-delivery.v1';
export const ids = ['learner.activity-completed', 'learner.history-survives-reload', 'learner.history-isolated'];
const prefix = 'DELIVERY_PRODUCT_PROBE_ASSERTION_STATUS_';
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}
export function validateContext(raw, digest) {
  const envelope = JSON.parse(raw);
  const context = envelope.intent;
  if (!envelope.organizationId || !envelope.projectId || !envelope.environmentId ||
      !envelope.release?.releaseId || !envelope.release?.decisionId ||
      envelope.release.stage !== 'DELIVERY_RELEASE_EXECUTION_STAGE_POST_DEPLOYMENT_PROBE')
    throw new Error('Missing admitted release binding');
  const actual = 'sha256:' + createHash('sha256').update(canonical(envelope)).digest('hex');
  if (digest !== actual) throw new Error('Context digest mismatch');
  if (context.contractId !== contractId || JSON.stringify(context.requiredAssertionIds) !== JSON.stringify(ids))
    throw new Error('Unsupported product contract');
  if (!/^sha256:[a-f0-9]{64}$/.test(context.runnerImageDigest) || !context.policyRevision) throw new Error('Missing admitted policy or image');
  if (!Array.isArray(context.targets) || !context.targets.length) throw new Error('Missing targets');
  const members = new Set();
  for (const target of context.targets) {
    if (!target.memberId || members.has(target.memberId)) throw new Error('Duplicate or missing member');
    members.add(target.memberId);
    const url = new URL(target.origin);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.origin !== target.origin)
      throw new Error('Target must be an origin');
    for (const key of ['runtimeObservationDigest', 'resourceGeneration', 'revisionUid', 'sourceCommitSha', 'sourceRepositoryId'])
      if (!target[key]) throw new Error('Missing target binding: ' + key);
  }
  return context;
}
export async function journey(browser, target, record) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  try {
    // Fetch without following redirects so no redirect hop can escape the origin.
    await context.route('**/*', async route => {
      if (new URL(route.request().url()).origin !== target.origin) return route.abort('blockedbyclient');
      try {
        const response = await route.fetch({ maxRedirects: 0, timeout: 15000 });
        if (response.status() >= 300 && response.status() < 400) return route.abort('blockedbyclient');
        await route.fulfill({ response });
      } catch { await route.abort('failed'); }
    });
    await context.routeWebSocket('**/*', socket => socket.close());
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(target.origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.locator('#curriculum-grid .curriculum-title', { hasText: '11+ starter bank' })).toBeVisible();
    await page.getByRole('button', { name: /Learner 2/ }).tap();
    await page.getByRole('button', { name: 'Adult', exact: true }).tap();
    await page.getByRole('button', { name: 'Learn language', exact: true }).tap();
    await expect(page.locator('#daily-mission-card strong')).toHaveText('Listen & recall: Adult');
    const bank = await page.evaluate(async () => {
      const response = await fetch('/questions.json');
      if (!response.ok) throw new Error('Question bank unavailable');
      return response.json();
    });
    const questions = bank.questions.filter(q => q.subject === 'Phonics' && q.difficulty === 'Foundation' && q.skill === 'Sound patterns');
    expect(questions).toHaveLength(3);
    await page.locator('#practice-options').getByRole('button', { name: 'Phonics (5)' }).tap();
    await page.locator('#difficulty-options').getByRole('button', { name: 'Foundation (12)' }).tap();
    await page.locator('#skill-options').getByRole('button', { name: 'Sound patterns (5)' }).tap();
    await page.getByRole('button', { name: 'Start this mission' }).tap();
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await expect(page.locator('#question-text')).toHaveText(q.question);
      await page.locator('#options-container .option').nth(q.answer).tap();
      await page.getByRole('button', { name: 'Submit answer' }).tap();
      await expect(page.locator('#explanation')).toContainText(q.explanation);
      await expect(page.locator('#explanation')).toHaveClass(/show/);
      await expect(page.locator('#opt-' + q.answer)).toHaveClass(/locked/);
      await page.getByRole('button', { name: i === questions.length - 1 ? 'Finish' : 'Next →' }).tap();
    }
    await expect(page.locator('#score-num')).toHaveText('3');
    await expect(page.locator('#score-total')).toHaveText('3');
    const history = () => page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-2') || '[]'));
    const saved = await history();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ activityType: 'question-bank-practice', practiceMode: 'Phonics', correct: 3, total: 3, percent: 100 });
    record(0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#learner-note')).toContainText('Progress is saved separately for Learner 2');
    await expect(page.locator('#history-panel')).toContainText('3/3 (100%)');
    expect(await history()).toEqual(saved);
    expect((await history()).length).toBeLessThanOrEqual(8);
    record(1);
    await page.getByRole('button', { name: /Learner 1/ }).tap();
    await expect(page.locator('#learner-note')).toContainText('Progress is saved separately for Learner 1');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('learningquest-history-v1-learner-1') || '[]'))).toEqual([]);
    await expect(page.locator('#history-panel')).toBeHidden();
    await page.getByRole('button', { name: /Learner 2/ }).tap();
    await expect(page.locator('#history-panel')).toContainText('3/3 (100%)');
    expect(await history()).toEqual(saved);
    record(2);
  } finally { await context.close(); }
}
export async function run(env = process.env) {
  const startedAt = new Date().toISOString();
  const counts = ids.map(() => 0);
  let failed = -1;
  let targets = 1;
  let browser;
  let exitCode = 0;
  try {
    const input = validateContext(env.APPS_PRODUCT_PROBE_CONTEXT, env.APPS_PRODUCT_PROBE_CONTEXT_DIGEST);
    targets = input.targets.length;
    browser = await chromium.launch({ headless: true });
    for (const target of input.targets) {
      let next = 0;
      try { await journey(browser, target, i => { counts[i]++; next = i + 1; }); }
      catch (error) { failed = Math.min(next, ids.length - 1); throw error; }
    }
  } catch (error) {
    exitCode = 1;
    // Deliberately omit URLs, context, and learner data from diagnostics.
    console.error('Product browser probe failed: ' + error.name);
  } finally {
    try { await browser?.close(); } catch { exitCode = 1; failed = 2; }
    const receipt = { contextDigest: env.APPS_PRODUCT_PROBE_CONTEXT_DIGEST || '', assertions: ids.map((id, i) => ({
      id, status: prefix + (failed === i ? 'FAILED' : counts[i] === targets ? 'PASSED' : 'SKIPPED')
    })), startedAt, finishedAt: new Date().toISOString() };
    const text = JSON.stringify(receipt);
    if (Buffer.byteLength(text) > 4096) throw new Error('Receipt too large');
    writeFileSync('/dev/termination-log', text);
  }
  return exitCode;
}
if (import.meta.url === new URL(process.argv[1], 'file:').href) process.exitCode = await run();

