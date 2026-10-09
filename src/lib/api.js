import { PREVIEW } from './env.js';
import { handleMock } from '../preview/mockServer.js';

export class ApiError extends Error {
  constructor(status, message, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Server bilan ishlash uchun yagona funksiya.
 * @param {string} path  — masalan '/api/products'
 * @param {{method?: string, body?: any, contentType?: string}} opts
 */
export async function api(path, { method = 'GET', body, contentType } = {}) {
  if (PREVIEW) {
    const { status, data } = await handleMock({ method, path, body, contentType });
    if (status >= 400) throw new ApiError(status, data.error, data.fields);
    return data;
  }

  const headers = { 'X-GooMarket': '1' };
  let payload;
  if (body instanceof Blob) {
    headers['Content-Type'] = contentType || body.type;
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'Internet aloqasi yo‘q yoki server javob bermayapti. Qayta urinib ko‘ring');
  }
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    throw new ApiError(res.status, data.error || `Xato (${res.status})`, data.fields || {});
  }
  return data;
}
