const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

function sendText(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

// Fail-closed local file access: request URLs never reach fs unless they
// decode cleanly and stay inside this application root.
function resolvePublicPath(requestUrl) {
  if (typeof requestUrl !== 'string' || requestUrl.includes('\0')) return null;

  const rawPath = requestUrl.split('?')[0];
  if (!rawPath || rawPath.includes('\0')) return null;

  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  if (
    decoded.includes('\0') ||
    decoded.includes('\\') ||
    decoded.includes('..')
  ) {
    return null;
  }

  const urlPath = decoded === '/' || decoded === '' ? '/index.html' : decoded;
  if (!urlPath.startsWith('/')) return null;

  const relative = urlPath.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, relative);
  const rootPrefix = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (resolved !== ROOT && !resolved.startsWith(rootPrefix)) return null;

  const rel = path.relative(ROOT, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;

  return resolved;
}

function serveResolvedFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, 'index.html'), (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const filePath = resolvePublicPath(req.url);
  if (!filePath) {
    sendText(res, 400, 'Bad request');
    return;
  }
  serveResolvedFile(res, filePath);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`📱 LearningQuest running on port ${PORT}`);
  });
}

module.exports = {
  ROOT,
  resolvePublicPath,
  server,
};
