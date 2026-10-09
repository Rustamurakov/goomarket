import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { db, nowIso } from './db.js';
import { config } from './config.js';

const scrypt = promisify(crypto.scrypt);

// ---------------------------------------------------------------------
//  Parollar: scrypt (xotira talab qiluvchi, zamonaviy hash algoritmi).
//  Format: scrypt$N$r$p$salt$hash — parametrlar keyinchalik oshirilsa ham
//  eski hashlar tekshirilaveradi.
// ---------------------------------------------------------------------
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64 };
const MAXMEM = 128 * 1024 * 1024;
export const PASSWORD_MIN = 10;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, SCRYPT.keylen, { ...SCRYPT, maxmem: MAXMEM });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  try {
    const [algo, N, r, p, saltB64, keyB64] = String(stored).split('$');
    if (algo !== 'scrypt') return false;
    const expected = Buffer.from(keyB64, 'base64');
    const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
    return crypto.timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

// Mavjud bo'lmagan foydalanuvchi uchun ham bir xil vaqt sarflanadi (login nomlarini taxmin qilib bo'lmasin)
let dummyHash = null;
async function getDummyHash() {
  if (!dummyHash) dummyHash = await hashPassword(crypto.randomBytes(16).toString('hex'));
  return dummyHash;
}

export function validateCredentials(username, password) {
  const errors = {};
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username || '')) {
    errors.username = 'Login 3–32 belgi: lotin harflari, raqamlar, nuqta, _ yoki -';
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    errors.password = `Parol kamida ${PASSWORD_MIN} belgidan iborat bo‘lsin`;
  } else if (password.length > 200) {
    errors.password = 'Parol juda uzun';
  }
  return errors;
}

export function adminCount() {
  return db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;
}

export async function createOrUpdateAdmin(username, password) {
  const hash = await hashPassword(password);
  const now = nowIso();
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    db.prepare('UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, now, existing.id);
    // Parol almashganda barcha eski sessiyalar bekor qilinadi
    db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(existing.id);
    return { id: existing.id, updated: true };
  }
  const res = db
    .prepare('INSERT INTO admins (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)')
    .run(username, hash, now, now);
  return { id: Number(res.lastInsertRowid), updated: false };
}

export async function authenticate(username, password) {
  const admin = db.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?').get(String(username || ''));
  const ok = await verifyPassword(String(password || ''), admin ? admin.password_hash : await getDummyHash());
  return admin && ok ? { id: admin.id, username: admin.username } : null;
}

// ---------------------------------------------------------------------
//  Sessiyalar: tasodifiy 256-bitli token cookie'da (HttpOnly),
//  bazada esa faqat uning SHA-256 hashi saqlanadi.
// ---------------------------------------------------------------------
export const SESSION_COOKIE = 'gm_admin';
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

export function createSession(adminId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + config.sessionDays * 864e5);
  db.prepare('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    sha256(token),
    adminId,
    nowIso(),
    expires.toISOString(),
  );
  return { token, maxAge: config.sessionDays * 86400 };
}

export function getSessionAdmin(token) {
  if (!token || token.length > 100) return null;
  const row = db
    .prepare(
      `SELECT a.id, a.username, s.expires_at FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ?`,
    )
    .get(sha256(token));
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, username: row.username };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function purgeExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso());
}

// ---------------------------------------------------------------------
//  Login urinishlarini cheklash: 15 daqiqada IP bo'yicha 10 ta,
//  IP + login juftligi bo'yicha 5 ta muvaffaqiyatsiz urinish.
// ---------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000;
const LIMITS = { ip: 10, pair: 5 };
const failures = new Map();

function hits(key) {
  const now = Date.now();
  const list = (failures.get(key) || []).filter((t) => now - t < WINDOW_MS);
  failures.set(key, list);
  return list;
}

export function loginBlockedFor(ip, username) {
  const ipHits = hits(`ip:${ip}`);
  const pairHits = hits(`pair:${ip}:${String(username).toLowerCase()}`);
  const blocked = ipHits.length >= LIMITS.ip ? ipHits : pairHits.length >= LIMITS.pair ? pairHits : null;
  if (!blocked) return 0;
  return Math.max(1, Math.ceil((blocked[0] + WINDOW_MS - Date.now()) / 1000));
}

export function recordLoginFailure(ip, username) {
  hits(`ip:${ip}`).push(Date.now());
  hits(`pair:${ip}:${String(username).toLowerCase()}`).push(Date.now());
}

export function clearLoginFailures(ip, username) {
  failures.delete(`pair:${ip}:${String(username).toLowerCase()}`);
}

setInterval(() => {
  for (const key of failures.keys()) if (!hits(key).length) failures.delete(key);
}, WINDOW_MS).unref();

// ---------------------------------------------------------------------
//  Birinchi administratorni brauzer orqali yaratish (server terminali
//  bo'lmagan hostinglar uchun). Bazada admin bo'lmasa, server ishga
//  tushganda bir martalik maxfiy kod yaratiladi va FAQAT server logiga
//  yoziladi. Admin yaratilgach kod o'chadi.
// ---------------------------------------------------------------------
let setupToken = null;

export function ensureSetupToken() {
  if (adminCount() > 0) {
    setupToken = null;
    return null;
  }
  if (!setupToken) setupToken = crypto.randomBytes(18).toString('base64url');
  return setupToken;
}

export function checkSetupToken(candidate) {
  if (!setupToken || typeof candidate !== 'string') return false;
  const a = Buffer.from(sha256(candidate));
  const b = Buffer.from(sha256(setupToken));
  return crypto.timingSafeEqual(a, b);
}

export function consumeSetupToken() {
  setupToken = null;
}
