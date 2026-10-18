import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// .env fayli bo'lsa, undagi sozlamalarni o'qiymiz (Node 20.12+ / 22 o'rnatilgan imkoniyati)
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch (err) {
    console.warn('⚠️  .env faylini o‘qib bo‘lmadi:', err.message);
  }
}

const env = process.env;
const resolveDir = (value, fallback) => path.resolve(ROOT, value || fallback);

export const config = {
  port: Number(env.PORT) || 3000,
  host: env.HOST || '0.0.0.0',
  // Ma'lumotlar bazasi va yuklangan rasmlar shu papkada saqlanadi.
  // Hostingda bu papka DOIMIY diskda bo'lishi shart (masalan, Render Disk yoki Railway Volume).
  dataDir: resolveDir(env.DATA_DIR, 'data'),
  distDir: resolveDir(env.DIST_DIR, 'dist'),
  // "auto" — HTTPS orqali kelgan so'rovlarda cookie Secure bo'ladi
  cookieSecure: (env.COOKIE_SECURE || 'auto').toLowerCase(),
  // Sayt Nginx / Render / Railway kabi proksi orqasida bo'lsa "true" qiling
  trustProxy: env.TRUST_PROXY === 'true',
  maxUploadBytes: Math.round((Number(env.MAX_UPLOAD_MB) || 5) * 1024 * 1024),
  // Cloudflare bepul tarifi so'rovni 100 MB bilan cheklaydi — shuning uchun 90 MB
  maxVideoBytes: Math.round((Number(env.MAX_VIDEO_MB) || 90) * 1024 * 1024),
  sessionDays: Number(env.SESSION_DAYS) || 7,
  // Ijtimoiy tarmoq preview'lari uchun saytning to'liq manzili, masalan https://goomarket.uz
  publicUrl: (env.PUBLIC_URL || '').replace(/\/+$/, ''),
  // Meta (Facebook/Instagram) Pixel ID — faqat raqamlar. Bo'sh bo'lsa Pixel o'chiq.
  metaPixelId: /^\d{8,20}$/.test(String(env.META_PIXEL_ID || '').trim()) ? String(env.META_PIXEL_ID).trim() : '',
};

export const paths = {
  db: path.join(config.dataDir, 'goomarket.db'),
  uploads: path.join(config.dataDir, 'uploads'),
};

fs.mkdirSync(paths.uploads, { recursive: true });
