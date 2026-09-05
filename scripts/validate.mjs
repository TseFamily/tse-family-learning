import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');

const hardcodedPrivateNames = ['Silas', 'Sylvie', 'Kyle', 'Cheryl', 'Tse Family', '謝家'];
for (const name of hardcodedPrivateNames) {
  if (html.includes(name)) throw new Error(`Private/family-specific UI name still present in index.html: ${name}`);
}

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
if (!scriptMatch) throw new Error('Could not locate inline script');
new vm.Script(scriptMatch[1]);

for (const forbidden of ['login', 'log in', 'log on', 'sign in', 'sign on', 'sign up', 'signup', 'password', 'create an account', 'created account', 'child account', 'protected child record', 'authenticated identity']) {
  if (new RegExp(`\\b${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(html)) {
    throw new Error(`TFL-LEARNER must not describe profiles as accounts or authenticated identities: ${forbidden}`);
  }
}

for (const forbidden of ['automatic cross-device sync', 'cross-device sync', 'auto-sync', 'cloud sync', 'background upload', 'account recovery', 'account-recovery', 'conflict resolution', 'automatically merge']) {
  if (html.includes(forbidden)) throw new Error(`TFL-CONTINUITY must not claim remote or automatic progress handling: ${forbidden}`);
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
  'live journey'
]) {
  if (html.includes(forbidden)) throw new Error(`TFL-APP must not claim an invented account, remote/chat/social surface, or deployed/live proof: ${forbidden}`);
}

for (const forbidden of [
  'french-planned',
  'French first phrases',
  "readiness: 'Planned'",
  'Primary Learning',
  'English Mastery'
]) {
  if (html.includes(forbidden)) throw new Error(`Planned domain/card or inline second copy of governed pack data still present: ${forbidden}`);
}

function validatePackFile(path, expectedId, fields, label) {
  const pack = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (pack.id !== expectedId) throw new Error(`${label} pack id changed unexpectedly`);
  if (!pack.activity) throw new Error(`${label} pack metadata must declare activity`);
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
  if (!pack.activity) throw new Error(`${label} pack metadata must declare activity`);
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
  if (!pack.activity) throw new Error(`${label} pack metadata must declare activity`);
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
for (const [id, path, fields, kind] of [
  ['hk-chinese-basics-v1', 'content-packs/hk-chinese-basics.json', ['traditional', 'jyutping', 'canto', 'english', 'prompt'], 'flashcards'],
  ['mandarin-basics-v1', 'content-packs/mandarin-basics.json', ['simplified', 'traditional', 'pinyin', 'english', 'prompt'], 'flashcards'],
  ['maths-foundation-v1', 'content-packs/maths-foundation.json', ['topic', 'skill', 'prompt', 'answer', 'strategy'], 'practice-cards'],
  ['life-uk-v1', 'content-packs/life-uk.json', ['topic', 'prompt', 'options', 'answer', 'explanation'], 'mock-questions']
]) {
  const registered = registryById[id];
  if (!registered) throw new Error(`Content pack registry missing ${id}`);
  if (registered.path !== path) throw new Error(`Content pack registry path mismatch for ${id}`);
  if (!Array.isArray(registered.schema) || fields.some(field => !registered.schema.includes(field))) throw new Error(`Content pack registry schema mismatch for ${id}`);
  if (registered.readiness === 'Planned') throw new Error(`Content pack registry ${id} is a planned label without valid pack data`);
  if (registered.kind !== kind) throw new Error(`Content pack registry ${id} must use ${kind} kind`);
  for (const field of ['kind', 'title', 'domain', 'language', 'learners', 'activity', 'readiness', 'next', 'renderTarget']) {
    if (!registered[field]) throw new Error(`Content pack registry ${id} missing ${field}`);
  }
  for (const field of ['recommendedStages', 'recommendedGoals']) {
    if (!Array.isArray(registered[field]) || !registered[field].length) throw new Error(`Content pack registry ${id} missing ${field}`);
  }
  if (!Array.isArray(registered.progressionSteps) || registered.progressionSteps.length < 3) throw new Error(`Content pack registry ${id} missing progressionSteps`);
}

validatePackFile('content-packs/hk-chinese-basics.json', 'hk-chinese-basics-v1', registryById['hk-chinese-basics-v1'].schema, 'HK Chinese');
validatePackFile('content-packs/mandarin-basics.json', 'mandarin-basics-v1', registryById['mandarin-basics-v1'].schema, 'Mandarin');
validateMathsPackFile('content-packs/maths-foundation.json', 'maths-foundation-v1', registryById['maths-foundation-v1'].schema, 'Maths Foundation');
validateLifeUKPackFile('content-packs/life-uk.json', 'life-uk-v1', registryById['life-uk-v1'].schema, 'Life in the UK');

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

const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
for (const field of ['name', 'short_name', 'description', 'start_url', 'scope', 'display', 'background_color', 'theme_color', 'orientation', 'categories', 'lang']) {
  if (!manifest[field]) throw new Error(`PWA manifest missing ${field}`);
}
if (manifest.display !== 'standalone') throw new Error('PWA manifest must use standalone display');
if (manifest.orientation !== 'portrait-primary') throw new Error('PWA manifest must declare portrait-primary orientation');
if (!Array.isArray(manifest.categories) || !manifest.categories.includes('education')) throw new Error('PWA manifest must declare the education category');
if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) throw new Error('PWA manifest must declare icons');
const iconSizes = new Set(manifest.icons.map(icon => icon.sizes));
if (!iconSizes.has('192x192') || !iconSizes.has('512x512')) throw new Error('PWA manifest must declare 192x192 and 512x512 icons');
for (const icon of manifest.icons) {
  if (!icon.src || !icon.sizes || icon.type !== 'image/png') {
    throw new Error('PWA manifest icons must declare src, sizes, and image/png type');
  }
}

console.log(`Validated LearningQuest static app with ${data.questions.length} questions.`);
