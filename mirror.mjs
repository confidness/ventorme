// Snapshot ventorme.ai (pages + every same-origin asset they pull in) into ./site for offline CRO analysis.
// Trackers are defanged so the copy never reports into their analytics. Usage: node mirror.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://ventorme.ai';
const OUT = fileURLToPath(new URL('./site/', import.meta.url));
const PAGES = ['/', '/register', '/login', '/for-parents', '/for-counselors', '/for-schools',
  '/for-universities', '/about', '/blog', '/cookies', '/privacy', '/terms'];
// root-relative file refs in html/css/js (also inside \"escaped\" RSC strings)
const ROOT_REF = /(?<![\w.\/:}])\/(?!\/)[\w\-.~%@\/]*?\.(?:png|jpe?g|webp|avif|svg|gif|ico|mp4|webm|woff2?|ttf|css|js|webmanifest)(?![\w\-.])/g;
// turbopack runtime lists chunks as "static/chunks/x.js"
const CHUNK_REF = /static\/(?:chunks|media)\/[\w\-.~%]+\.\w+/g;
// css url(../media/x.woff2), resolved against the css file
const CSS_URL = /url\(\s*['"]?(?!data:)([^'")]+)/g;
// videos are built at runtime as `${C}/x.mp4` where C = "/video/v4"
const RUNTIME_VIDEO = /\$\{\w+\}\/([\w\-.]+\.(?:mp4|webm))/g;

const seen = new Set(), queue = [], failed = [];
const add = p => { if (!seen.has(p)) { seen.add(p); queue.push(p); } };

async function grab(p) {
  const res = await fetch(ORIGIN + p, { headers: { 'accept-language': 'ru', cookie: 'locale=ru' } });
  if (!res.ok) return failed.push(`${res.status} ${p}`);
  let body = Buffer.from(await res.arrayBuffer());
  if (/text|javascript|json|css|svg|xml/.test(res.headers.get('content-type'))) {
    const t = body.toString('utf8')
      .replaceAll('mc.yandex.ru', 'mc.yandex.invalid')
      .replaceAll('connect.facebook.net', 'connect.facebook.invalid');
    for (const m of t.matchAll(ROOT_REF)) add(m[0]);
    for (const m of t.matchAll(CHUNK_REF)) add('/_next/' + m[0]);
    for (const m of t.matchAll(RUNTIME_VIDEO)) add('/video/v4/' + m[1]);
    if (p.endsWith('.css')) for (const m of t.matchAll(CSS_URL)) {
      const u = new URL(m[1], ORIGIN + p);
      if (u.origin === ORIGIN) add(u.pathname);
    }
    body = Buffer.from(t);
  }
  const file = PAGES.includes(p) ? join(OUT, p, 'index.html') : join(OUT, decodeURIComponent(p));
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body);
}

PAGES.forEach(add);
const worker = async () => { while (queue.length) await grab(queue.shift()).catch(e => failed.push(`${e.message} ${e.cause?.code ?? ''}`)); };
while (queue.length) await Promise.all(Array.from({ length: 8 }, worker));
console.log(`saved ${seen.size - failed.length}/${seen.size} -> ${OUT}`);
if (failed.length) console.log('failed:\n' + failed.join('\n'));
