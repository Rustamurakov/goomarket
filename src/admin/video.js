// =====================================================================
//  Video yuklash: turi va hajmini tekshirish, yuklanish foizini ko'rsatish.
//  Server faylni baribir o'zi ham tekshiradi.
// =====================================================================
import { PREVIEW } from '../lib/env.js';
import { ApiError } from '../lib/api.js';

export const VIDEO_ACCEPT = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_VIDEO_MB = 90;

export function checkVideo(file) {
  const type = file.type || (/\.mov$/i.test(file.name) ? 'video/quicktime' : '');
  if (!VIDEO_ACCEPT.includes(type)) {
    throw new ApiError(415, `"${file.name}" — video emas. MP4 (tavsiya etiladi), WEBM yoki MOV yuklang`);
  }
  if (file.size > MAX_VIDEO_MB * 1048576) {
    throw new ApiError(413, `Video juda katta (${(file.size / 1048576).toFixed(0)} MB). ${MAX_VIDEO_MB} MB gacha bo‘lsin — qisqaroq qiling yoki siqing`);
  }
  return type;
}

/** @returns {Promise<string>} yuklangan video manzili */
export function uploadVideo(file, onProgress) {
  const type = checkVideo(file);

  if (PREVIEW) {
    // Ko'rgazma rejimi: video faqat shu sahifa ochiq turganda ishlaydi
    onProgress?.(100);
    return Promise.resolve(URL.createObjectURL(file));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/uploads/video');
    xhr.setRequestHeader('Content-Type', type);
    xhr.setRequestHeader('X-GooMarket', '1');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new ApiError(xhr.status, data.error || `Video yuklanmadi (${xhr.status})`));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Internet aloqasi uzildi. Qayta urinib ko‘ring'));
    xhr.send(file);
  });
}
