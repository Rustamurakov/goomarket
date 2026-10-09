import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { paths } from './config.js';
import { referencedImages } from './products-repo.js';

// Faylning haqiqiy turi nomi yoki brauzer aytganiga qarab emas,
// ichidagi "sehrli baytlar" bo'yicha aniqlanadi.
export function detectImageType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

export const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
export const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

/** Video turi ham baytlar bo'yicha aniqlanadi: MP4/MOV ("ftyp") yoki WebM (EBML) */
export function detectVideoType(buf) {
  if (buf.length < 12) return null;
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    return buf.subarray(8, 10).toString('ascii') === 'qt' ? 'mov' : 'mp4';
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'webm';
  return null;
}

/**
 * Videoni so'rovdan to'g'ridan-to'g'ri diskka yozadi (xotiraga sig'dirmasdan).
 * Birinchi baytlar video emasligini ko'rsatsa yoki hajm oshsa — fayl o'chiriladi.
 */
export function saveVideoStream(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomBytes(16).toString('hex');
    const tmp = path.join(paths.uploads, `${id}.part`);
    const out = fs.createWriteStream(tmp, { flags: 'wx' });
    let size = 0;
    let type = null;
    let head = Buffer.alloc(0);
    let failed = false;
    const fail = (err) => {
      if (failed) return;
      failed = true;
      req.unpipe?.();
      req.resume();
      out.destroy();
      fs.rm(tmp, { force: true }, () => reject(err));
    };
    req.on('data', (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > maxBytes) return fail(Object.assign(new Error('too_large'), { code: 'too_large' }));
      if (!type) {
        head = Buffer.concat([head, chunk]);
        if (head.length >= 12) {
          type = detectVideoType(head);
          if (!type) return fail(Object.assign(new Error('not_video'), { code: 'not_video' }));
          out.write(head);
        }
        return;
      }
      if (!out.write(chunk)) {
        req.pause();
        out.once('drain', () => req.resume());
      }
    });
    req.on('end', () => {
      if (failed) return;
      if (!type) return fail(Object.assign(new Error('not_video'), { code: 'not_video' }));
      out.end(() => {
        const name = `${id}.${type}`;
        fs.rename(tmp, path.join(paths.uploads, name), (err) => (err ? fail(err) : resolve(`/uploads/${name}`)));
      });
    });
    req.on('error', fail);
    out.on('error', fail);
  });
}

export function saveImage(buf) {
  const type = detectImageType(buf);
  if (!type) return null;
  const name = `${crypto.randomBytes(16).toString('hex')}.${type}`;
  fs.writeFileSync(path.join(paths.uploads, name), buf, { flag: 'wx' });
  return `/uploads/${name}`;
}

/** /uploads/<nom> manzilini diskdagi xavfsiz yo'lga aylantiradi */
export function uploadPath(urlPath) {
  const name = urlPath.replace(/^\/uploads\//, '');
  if (!/^[a-f0-9]{32}\.(jpg|png|webp|mp4|webm|mov)$/.test(name)) return null;
  return path.join(paths.uploads, name);
}

/**
 * Hech bir mahsulotda ishlatilmayotgan rasmlarni o'chiradi.
 * Yangi yuklangan, lekin hali saqlanmagan rasmlar tasodifan o'chmasligi
 * uchun `minAgeMs` dan yosh fayllarga tegilmaydi.
 */
export function cleanupOrphans(minAgeMs = 24 * 3600 * 1000) {
  const used = referencedImages();
  let removed = 0;
  for (const name of fs.readdirSync(paths.uploads)) {
    if (name.endsWith('.part')) {
      try {
        if (Date.now() - fs.statSync(path.join(paths.uploads, name)).mtimeMs >= minAgeMs) fs.unlinkSync(path.join(paths.uploads, name));
      } catch {}
      continue;
    }
    const url = `/uploads/${name}`;
    if (used.has(url)) continue;
    const file = uploadPath(url);
    if (!file) continue;
    try {
      const age = Date.now() - fs.statSync(file).mtimeMs;
      if (age >= minAgeMs) {
        fs.unlinkSync(file);
        removed++;
      }
    } catch {}
  }
  return removed;
}

/** Aniq ro'yxatdagi rasmlarni, agar boshqa mahsulot ishlatmasa, darhol o'chiradi */
export function removeIfUnused(urls) {
  const used = referencedImages();
  for (const url of urls) {
    if (!url || used.has(url)) continue;
    const file = uploadPath(url);
    if (file) fs.rm(file, { force: true }, () => {});
  }
}
