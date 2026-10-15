// Serve ./site like the real host: pages by path, assets by file, /api stubbed as a logged-out visitor.
// Usage: node serve.mjs [port] [folder]  ->  http://localhost:8080  (folder defaults to ./site)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[3] ? resolve(process.argv[3]) + sep : fileURLToPath(new URL('./site/', import.meta.url));
const PORT = process.argv[2] || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
// What production answers a logged-out visitor; their ux recorder is switched off so nothing is captured.
const API = { '/api/user/profile': '{"anonymous":true}', '/api/ux/cfg': '{"on":false}' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.startsWith('/api/') && !path.startsWith('/api/resources/')) {
    res.writeHead(API[path] ? 200 : 204, { 'content-type': 'application/json' });
    return res.end(API[path]);
  }
  for (const f of [join(ROOT, path), join(ROOT, path, 'index.html')]) {
    if (!f.startsWith(ROOT)) break;
    try {
      const body = await readFile(f);
      res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
      return res.end(body);
    } catch {}
  }
  console.log('404', req.url);
  res.writeHead(404).end();
}).listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}`));
