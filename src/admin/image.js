// =====================================================================
//  Rasmni yuklashdan oldin tayyorlash:
//  - turi va hajmini tekshirish;
//  - juda katta rasmlarni 1600 px gacha kichraytirish;
//  - WEBP formatiga siqish (sayt tezroq ochiladi, ayniqsa telefonda).
//  Server baribir faylni o'zi ham tekshiradi.
// =====================================================================
import { api } from '../lib/api.js';

export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_INPUT_MB = 15;
export const MAX_UPLOAD_MB = 5;
const MAX_SIDE = 1600;

export class ImageError extends Error {}

export function checkFile(file) {
  const name = file.name || '';
  if (/\.(heic|heif)$/i.test(name) || /hei[cf]/i.test(file.type)) {
    throw new ImageError('iPhone HEIC formati qo‘llanmaydi. Rasmni JPG qilib saqlang yoki skrinshot oling');
  }
  if (!ACCEPTED.includes(file.type)) {
    throw new ImageError(`"${name}" — rasm emas. Faqat JPG, PNG yoki WEBP yuklash mumkin`);
  }
  if (file.size > MAX_INPUT_MB * 1024 * 1024) {
    throw new ImageError(`"${name}" juda katta (${(file.size / 1048576).toFixed(1)} MB). ${MAX_INPUT_MB} MB gacha bo‘lsin`);
  }
}

async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {}
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageError('Rasmni ochib bo‘lmadi. Fayl shikastlangan bo‘lishi mumkin'));
    img.src = URL.createObjectURL(file);
  });
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function optimize(file) {
  const img = await decode(file);
  const w = img.width || img.naturalWidth;
  const h = img.height || img.naturalHeight;
  if (!w || !h) throw new ImageError('Rasmni ochib bo‘lmadi');
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close?.();

  let out = await toBlob(canvas, 'image/webp', 0.85);
  if (!out || out.type !== 'image/webp') out = await toBlob(canvas, 'image/jpeg', 0.88);
  if (!out) return file;
  // Kichraytirish kerak bo'lmagan va asl fayl allaqachon kichikroq bo'lsa — aslini qoldiramiz
  if (scale === 1 && file.size <= out.size && file.size <= MAX_UPLOAD_MB * 1048576) return file;
  if (out.size > MAX_UPLOAD_MB * 1048576) {
    throw new ImageError(`Rasm siqilgandan keyin ham ${MAX_UPLOAD_MB} MB dan katta. Kichikroq rasm tanlang`);
  }
  return out;
}

/** Tekshiradi, siqadi va serverga yuklaydi. Natija: '/uploads/...' manzili */
export async function uploadImage(file) {
  checkFile(file);
  const blob = await optimize(file);
  const { url } = await api('/api/admin/uploads', { method: 'POST', body: blob, contentType: blob.type });
  return url;
}
