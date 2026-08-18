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

function request(port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: urlPath }, (res) => {
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

server.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();
  try {
    const home = await request(port, '/');
    assert.equal(home.status, 200);
    assert.match(home.body, /LearningQuest/);

    const asset = await request(port, '/manifest.webmanifest');
    assert.equal(asset.status, 200);

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
