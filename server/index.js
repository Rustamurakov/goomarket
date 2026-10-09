import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { config, paths } from './config.js';
import { validateProduct, CATEGORY_IDS } from '../shared/product-schema.js';
import * as repo from './products-repo.js';
import * as auth from './auth.js';
import { listExamples, importExample, examplePreviewPath } from './examples.js';
import { saveImage, saveVideoStream, uploadPath, cleanupOrphans, removeIfUnused, MIME, VIDEO_MIME } from './uploads.js';
import {
  HttpError,
  sendJson,
  readJson,
  readBody,
  parseCookies,
  cookieHeader,
  clientIp,
  assertSameOrigin,
  securityHeaders,
  isHttps,
} from './http-utils.js';

// =====================================================================
//  API
// =====================================================================

function requireAdmin(req) {
  const token = parseCookies(req)[auth.SESSION_COOKIE];
  const admin = auth.getSessionAdmin(token);
  if (!admin) throw new HttpError(401, 'Avval tizimga kiring');
  return admin;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Mahsulot topilmadi');
  return id;
}

function saveProduct(input, existingRow = null) {
  const { data, errors } = validateProduct(input);
  if (!data) throw new HttpError(422, 'Ba’zi maydonlar to‘g‘ri to‘ldirilmagan', { fields: errors });
  try {
    if (existingRow) return repo.updateProduct(existingRow.id, data);
    return repo.createProduct(data, { slugExplicit: Boolean(String(input.slug || '').trim()) });
  } catch (err) {
    if (err instanceof repo.ConflictError) {
      throw new HttpError(409, err.message, { fields: { [err.field]: err.message } });
    }
    throw err;
  }
}

const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const regex = new RegExp(
    `^${pattern.replace(/:(\w+)/g, (_, k) => {
      keys.push(k);
      return '([^/]+)';
    })}$`,
  );
  routes.push({ method, regex, keys, handler });
};

// ---------- Ommaviy API ----------
route('GET', '/api/products', (req, res) => {
  sendJson(res, 200, { products: repo.listActive() });
});

route('GET', '/api/products/:slug', (req, res, { slug }) => {
  const found = repo.findActiveBySlug(slug);
  if (!found) throw new HttpError(404, 'Mahsulot topilmadi');
  sendJson(res, 200, found);
});

// ---------- Kirish / chiqish ----------
route('GET', '/api/admin/setup-status', (req, res) => {
  sendJson(res, 200, { setupRequired: auth.adminCount() === 0 });
});

route('POST', '/api/admin/setup', async (req, res) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  const wait = auth.loginBlockedFor(ip, '__setup__');
  if (wait) throw new HttpError(429, 'Juda ko‘p urinish. Birozdan keyin qayta urinib ko‘ring', {}, { 'Retry-After': String(wait) });
  if (auth.adminCount() > 0) throw new HttpError(409, 'Administrator allaqachon yaratilgan. Login sahifasidan kiring');
  const body = await readJson(req);
  if (!auth.checkSetupToken(body.token)) {
    auth.recordLoginFailure(ip, '__setup__');
    throw new HttpError(403, 'Sozlash kodi noto‘g‘ri. Kodni server logidan aynan nusxa oling', { fields: { token: 'Kod noto‘g‘ri' } });
  }
  const username = String(body.username || '').trim();
  const fields = auth.validateCredentials(username, body.password);
  if (Object.keys(fields).length) throw new HttpError(422, 'Ma’lumotlarni tekshiring', { fields });
  const admin = await auth.createOrUpdateAdmin(username, body.password);
  auth.consumeSetupToken();
  const session = auth.createSession(admin.id);
  sendJson(res, 201, { admin: { username } }, { 'Set-Cookie': cookieHeader(req, auth.SESSION_COOKIE, session.token, session.maxAge) });
});

route('POST', '/api/admin/login', async (req, res) => {
  assertSameOrigin(req);
  const body = await readJson(req, 16 * 1024);
  const username = String(body.username || '').trim().slice(0, 64);
  const ip = clientIp(req);
  const wait = auth.loginBlockedFor(ip, username);
  if (wait) {
    throw new HttpError(429, `Juda ko‘p noto‘g‘ri urinish. ${Math.ceil(wait / 60)} daqiqadan keyin qayta urinib ko‘ring`, {}, {
      'Retry-After': String(wait),
    });
  }
  const admin = await auth.authenticate(username, String(body.password || ''));
  if (!admin) {
    auth.recordLoginFailure(ip, username);
    throw new HttpError(401, 'Login yoki parol noto‘g‘ri');
  }
  auth.clearLoginFailures(ip, username);
  const session = auth.createSession(admin.id);
  sendJson(res, 200, { admin: { username: admin.username } }, {
    'Set-Cookie': cookieHeader(req, auth.SESSION_COOKIE, session.token, session.maxAge),
  });
});

route('POST', '/api/admin/logout', (req, res) => {
  assertSameOrigin(req);
  auth.destroySession(parseCookies(req)[auth.SESSION_COOKIE]);
  sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookieHeader(req, auth.SESSION_COOKIE, '', 0) });
});

route('GET', '/api/admin/session', (req, res) => {
  const admin = requireAdmin(req);
  sendJson(res, 200, { admin: { username: admin.username } });
});

// ---------- Mahsulotlarni boshqarish (faqat admin) ----------
route('GET', '/api/admin/stats', (req, res) => {
  requireAdmin(req);
  sendJson(res, 200, repo.stats());
});

route('GET', '/api/admin/products', (req, res) => {
  requireAdmin(req);
  sendJson(res, 200, { products: repo.listAll(), categories: CATEGORY_IDS });
});

route('GET', '/api/admin/products/:id', (req, res, { id }) => {
  requireAdmin(req);
  const row = repo.getRowById(parseId(id));
  if (!row) throw new HttpError(404, 'Mahsulot topilmadi');
  sendJson(res, 200, { product: repo.toAdmin(row) });
});

route('POST', '/api/admin/products', async (req, res) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const product = saveProduct(await readJson(req));
  sendJson(res, 201, { product });
});

route('PUT', '/api/admin/products/:id', async (req, res, { id }) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const row = repo.getRowById(parseId(id));
  if (!row) throw new HttpError(404, 'Mahsulot topilmadi');
  const before = repo.fileUrls(row);
  const product = saveProduct(await readJson(req), row);
  removeIfUnused(before);
  sendJson(res, 200, { product });
});

// Qisman yangilash: jadvaldan narx, holat yoki "bosh sahifada" belgisini tez o'zgartirish
route('PATCH', '/api/admin/products/:id', async (req, res, { id }) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const row = repo.getRowById(parseId(id));
  if (!row) throw new HttpError(404, 'Mahsulot topilmadi');
  const body = await readJson(req, 16 * 1024);
  const allowed = ['price', 'oldPrice', 'status', 'featured'];
  const patch = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(patch).length) throw new HttpError(400, 'O‘zgartiriladigan maydon yo‘q');
  const product = saveProduct({ ...repo.rowToInput(row), ...patch }, row);
  sendJson(res, 200, { product });
});

route('DELETE', '/api/admin/products/:id', (req, res, { id }) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const row = repo.getRowById(parseId(id));
  if (!row) throw new HttpError(404, 'Mahsulot topilmadi');
  repo.deleteProduct(row.id);
  removeIfUnused(repo.fileUrls(row));
  sendJson(res, 200, { ok: true });
});

route('POST', '/api/admin/uploads', async (req, res) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  if (!Object.values(MIME).includes(type)) {
    throw new HttpError(415, 'Faqat JPG, PNG yoki WEBP rasm yuklash mumkin');
  }
  const buf = await readBody(req, config.maxUploadBytes);
  if (!buf.length) throw new HttpError(400, 'Fayl bo‘sh');
  const url = saveImage(buf);
  if (!url) throw new HttpError(415, 'Fayl rasm emas yoki shikastlangan. JPG, PNG yoki WEBP yuklang');
  sendJson(res, 201, { url });
});

// ---------- Tayyor namunalar (terminalsiz hostinglar uchun) ----------
route('GET', '/api/admin/examples', (req, res) => {
  requireAdmin(req);
  sendJson(res, 200, { examples: listExamples() });
});

route('GET', '/api/admin/examples/:id/image/:file', (req, res, { id, file }) => {
  requireAdmin(req);
  const p = examplePreviewPath(id, file);
  if (!p) throw new HttpError(404, 'Topilmadi');
  serveFile(req, res, p, { cache: 'private, max-age=3600', type: MIME[path.extname(p).slice(1)] });
});

route('POST', '/api/admin/examples/:id/import', async (req, res, { id }) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const body = await readJson(req, 16 * 1024);
  const { product, errors } = importExample(id, { price: body.price, oldPrice: body.oldPrice, uzumUrl: body.uzumUrl });
  if (!product) throw new HttpError(422, 'Ma’lumotlarni tekshiring', { fields: errors });
  sendJson(res, 201, { product });
});

route('POST', '/api/admin/uploads/video', async (req, res) => {
  requireAdmin(req);
  assertSameOrigin(req);
  const type = String(req.headers['content-type'] || '').split(';')[0].trim();
  if (!VIDEO_MIME.includes(type)) throw new HttpError(415, 'Faqat MP4, WEBM yoki MOV video yuklash mumkin');
  const declared = Number(req.headers['content-length']);
  const limitMb = Math.round(config.maxVideoBytes / 1048576);
  if (declared && declared > config.maxVideoBytes) {
    req.resume();
    throw new HttpError(413, `Video ${limitMb} MB dan katta. Qisqaroq yoki siqilgan video yuklang`);
  }
  try {
    const url = await saveVideoStream(req, config.maxVideoBytes);
    sendJson(res, 201, { url });
  } catch (err) {
    if (err.code === 'too_large') throw new HttpError(413, `Video ${limitMb} MB dan katta. Qisqaroq yoki siqilgan video yuklang`);
    if (err.code === 'not_video') throw new HttpError(415, 'Fayl video emas yoki shikastlangan. MP4 formatida yuklang');
    throw err;
  }
});

// =====================================================================
//  Statik fayllar: tayyor sayt (dist) va yuklangan rasmlar
// =====================================================================

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function serveFile(req, res, file, { cache, type }) {
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return serveApp(req, res);
    const headers = {
      'Content-Type': type || STATIC_TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': cache,
      'Accept-Ranges': 'bytes',
    };
    // Video uchun qisman yuklash (Range) — iPhone Safari va oldinga surish uchun shart
    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
    if (range && (range[1] || range[2])) {
      let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
      start = Math.max(0, start);
      end = Math.min(end, stat.size - 1);
      if (start > end || start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': stat.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

let indexCache = { mtime: 0, html: null };
function indexHtml() {
  const file = path.join(config.distDir, 'index.html');
  try {
    const { mtimeMs } = fs.statSync(file);
    if (mtimeMs !== indexCache.mtime) indexCache = { mtime: mtimeMs, html: fs.readFileSync(file, 'utf8') };
    return indexCache.html;
  } catch {
    return null;
  }
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

// Instagram/Telegram havola preview'lari JavaScript'ni ishga tushirmaydi —
// shuning uchun mahsulot sahifasi uchun sarlavha va rasm serverda qo'yiladi.
function serveApp(req, res) {
  const url = new URL(req.url, 'http://x');
  const m = url.pathname.match(/^\/product\/([^/]+)\/?$/);
  let found = null;
  if (m) {
    try {
      found = repo.findActiveBySlug(decodeURIComponent(m[1]));
    } catch {}
    if (found?.redirect) {
      res.writeHead(301, { Location: `/product/${encodeURIComponent(found.redirect)}` });
      return res.end();
    }
  }
  let html = indexHtml();
  if (!html) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Sayt hali yig‘ilmagan. Avval "npm run build" buyrug‘ini bajaring.');
  }
  let status = 200;
  if (m) {
    if (found?.product) {
      const p = found.product;
      const origin = config.publicUrl || `${isHttps(req) ? 'https' : 'http'}://${req.headers.host}`;
      const title = `${p.name.uz} — GooMarket`;
      const desc = (p.desc.uz || p.name.ru).replace(/\s+/g, ' ').slice(0, 180);
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
      html = setMeta(html, 'name', 'description', desc);
      html = setMeta(html, 'property', 'og:title', title);
      html = setMeta(html, 'property', 'og:description', desc);
      html = setMeta(html, 'property', 'og:type', 'product');
      html = setMeta(html, 'property', 'og:url', `${origin}/product/${p.slug}`);
      if (p.image) html = setMeta(html, 'property', 'og:image', `${origin}${p.image}`);
    } else {
      status = 404;
    }
  }
  if (url.pathname.startsWith('/admin')) html = setMeta(html, 'name', 'robots', 'noindex, nofollow');
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(req.method === 'HEAD' ? undefined : html);
}

function serveStatic(req, res, pathname) {
  if (pathname.startsWith('/uploads/')) {
    const file = uploadPath(pathname);
    if (!file) return notFound(res);
    const ext = path.extname(file).slice(1);
    return serveFile(req, res, file, { cache: 'public, max-age=31536000, immutable', type: MIME[ext] });
  }
  if (pathname === '/' || !path.extname(pathname)) return serveApp(req, res);

  const file = path.resolve(config.distDir, `.${decodeURIComponent(pathname)}`);
  if (!file.startsWith(config.distDir + path.sep)) return notFound(res);
  const cache = pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';
  serveFile(req, res, file, { cache });
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Topilmadi');
}

// =====================================================================
//  Server
// =====================================================================

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  let pathname;
  try {
    pathname = new URL(req.url, 'http://x').pathname;
  } catch {
    return sendJson(res, 400, { error: 'Noto‘g‘ri manzil' });
  }

  if (!pathname.startsWith('/api/')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Ruxsat etilmagan' });
    return serveStatic(req, res, pathname);
  }

  try {
    let matchedPath = false;
    for (const r of routes) {
      const m = pathname.match(r.regex);
      if (!m) continue;
      matchedPath = true;
      if (r.method !== req.method) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      await r.handler(req, res, params);
      return;
    }
    throw new HttpError(matchedPath ? 405 : 404, matchedPath ? 'Ruxsat etilmagan' : 'Topilmadi');
  } catch (err) {
    if (err instanceof HttpError) {
      return sendJson(res, err.status, { error: err.message, ...err.extra }, err.headers);
    }
    console.error('Server xatosi:', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Serverda kutilmagan xato. Birozdan keyin qayta urinib ko‘ring' });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`\n✅ GooMarket ishga tushdi: http://localhost:${config.port}`);
  console.log(`   Ma'lumotlar papkasi: ${config.dataDir}`);
  const token = auth.ensureSetupToken();
  if (token) {
    console.log('\n🔐 Hali administrator yo‘q. Ikki usuldan birini tanlang:');
    console.log('   1) Terminalda:  npm run create-admin');
    console.log(`   2) Brauzerda:   http://localhost:${config.port}/admin/setup  va shu bir martalik kodni kiriting:`);
    console.log(`      ${token}`);
    console.log('   Kod faqat birinchi administrator yaratilguncha amal qiladi.\n');
  }
});

// Muntazam tozalash: muddati o'tgan sessiyalar va hech qayerda ishlatilmayotgan rasmlar
auth.purgeExpiredSessions();
cleanupOrphans();
setInterval(() => {
  auth.purgeExpiredSessions();
  cleanupOrphans();
}, 3600 * 1000).unref();

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}

export { server };
