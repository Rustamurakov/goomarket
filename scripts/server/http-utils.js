import { config } from './config.js';

export class HttpError extends Error {
  constructor(status, message, extra = {}, headers = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
    this.headers = headers;
  }
}

export function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

export function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length']);
    if (declared && declared > limitBytes) {
      reject(new HttpError(413, 'Fayl yoki so‘rov hajmi juda katta'));
      req.resume();
      return;
    }
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new HttpError(413, 'Fayl yoki so‘rov hajmi juda katta'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readJson(req, limitBytes = 1024 * 1024) {
  const type = String(req.headers['content-type'] || '');
  if (!type.startsWith('application/json')) throw new HttpError(415, 'JSON kutilgan edi');
  const buf = await readBody(req, limitBytes);
  try {
    return JSON.parse(buf.toString('utf8') || '{}');
  } catch {
    throw new HttpError(400, 'So‘rov ma’lumoti noto‘g‘ri');
  }
}

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {}
  }
  return out;
}

export function isHttps(req) {
  if (req.socket.encrypted) return true;
  if (config.trustProxy) return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  return false;
}

export function cookieHeader(req, name, value, maxAgeSec) {
  const secure = config.cookieSecure === 'true' || (config.cookieSecure === 'auto' && isHttps(req));
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSec}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function clientIp(req) {
  if (config.trustProxy) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * CSRF himoyasi: o'zgartiruvchi admin so'rovlari faqat shu saytning o'zidan
 * kelishi kerak. Brauzer boshqa saytdan maxsus sarlavha (X-GooMarket)
 * yubora olmaydi, Origin esa xostga mos bo'lishi shart.
 */
export function assertSameOrigin(req) {
  if (req.headers['x-goomarket'] !== '1') throw new HttpError(403, 'Ruxsat etilmagan so‘rov');
  const origin = req.headers.origin;
  if (origin) {
    let host;
    try {
      host = new URL(origin).host;
    } catch {
      throw new HttpError(403, 'Ruxsat etilmagan so‘rov');
    }
    const expected = (config.trustProxy && req.headers['x-forwarded-host']) || req.headers.host;
    if (host !== expected) throw new HttpError(403, 'Ruxsat etilmagan so‘rov');
  }
}

// Xavfsizlik sarlavhalari (barcha javoblar uchun)
export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Meta Pixel yoqilgan bo'lsa (META_PIXEL_ID), uning domenlariga ruxsat beriladi.
  const fb = config.metaPixelId;
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self'${fb ? ' https://connect.facebook.net' : ''}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: https://i.ytimg.com${fb ? ' https://www.facebook.com' : ''}`,
      "media-src 'self' blob:",
      "frame-src https://www.youtube-nocookie.com",
      `connect-src 'self'${fb ? ' https://www.facebook.com https://connect.facebook.net' : ''}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      `form-action 'self'${fb ? ' https://www.facebook.com' : ''}`,
      "object-src 'none'",
    ].join('; '),
  );
}
