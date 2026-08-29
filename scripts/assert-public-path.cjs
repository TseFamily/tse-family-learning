const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { ROOT, resolvePublicPath, server } = require('../server.js');

function expectInside(requestUrl, relativeFile) {
  const resolved = resolvePublicPath(requestUrl);
  assert.equal(resolved, path.join(ROOT, relativeFile), requestUrl);
}

function expectRejected(requestUrl) {
  assert.equal(resolvePublicPath(requestUrl), null, requestUrl);
}

expectInside('/', 'index.html');
expectInside('/index.html', 'index.html');
expectInside('/manifest.webmanifest', 'manifest.webmanifest');
expectInside('/content-packs/registry.json', path.join('content-packs', 'registry.json'));
expectInside('/index.html?cache=1', 'index.html');

expectRejected(path.join('..', 'package.json'));
expectRejected('/' + path.join('..', 'package.json'));
expectRejected('/' + path.join('content-packs', '..', '..', 'package.json'));
expectRejected('/' + encodeURIComponent('..') + '/package.json');
expectRejected('/index.html%00.js');
expectRejected('/\\package.json');
expectRejected('%E0%A4%A');

function request(port, urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: urlPath, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
  });
}

const PRIVATE_SHELL_NAMES = ['Silas', 'Sylvie', 'Kyle', 'Cheryl', 'Tse Family', '謝家'];

server.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();
  try {
    const home = await request(port, '/');
    assert.equal(home.status, 200);
    assert.match(home.body, /LearningQuest/);
    for (const name of PRIVATE_SHELL_NAMES) {
      assert.equal(home.body.includes(name), false, `served shell still contains ${name}`);
    }

    const staffHome = await request(port, '/', { 'x-staff': '1', 'x-first-party': 'sylphx' });
    assert.equal(staffHome.status, home.status);
    assert.equal(staffHome.body, home.body);

    const asset = await request(port, '/manifest.webmanifest');
    assert.equal(asset.status, 200);
    const manifest = JSON.parse(asset.body);
    assert.equal(manifest.display, 'standalone');

    const bank = await request(port, '/questions.json');
    assert.equal(bank.status, 200);
    const questions = JSON.parse(bank.body);
    assert.ok(Array.isArray(questions.questions) && questions.questions.length >= 20);

    const registry = await request(port, '/content-packs/registry.json');
    assert.equal(registry.status, 200);
    const catalog = JSON.parse(registry.body);
    assert.ok(Array.isArray(catalog.packs) && catalog.packs.length >= 4);

    const escaped = await request(port, '/' + path.join('..', 'package.json'));
    assert.equal(escaped.status, 400);
    assert.equal(escaped.body, 'Bad request');

    const encoded = await request(port, '/' + encodeURIComponent('..') + '/package.json');
    assert.equal(encoded.status, 400);
    assert.equal(encoded.body, 'Bad request');

    console.log('public-path oracle: pass');
    server.close();
  } catch (error) {
    server.close();
    console.error(error);
    process.exit(1);
  }
});
