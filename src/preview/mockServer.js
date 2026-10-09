// =====================================================================
//  KO'RGAZMA REJIMI UCHUN SOXTA SERVER (faqat serversiz preview build).
//  Haqiqiy saytda ishlatilmaydi. Ma'lumotlar faqat sahifa ochiq turgan
//  vaqtda xotirada yashaydi va hech qayerga saqlanmaydi.
// =====================================================================
import { PREVIEW } from '../lib/env.js';
import { DEMO_PRODUCTS } from '../../shared/demo-products.js';
import { validateProduct, CATEGORY_IDS } from '../../shared/product-schema.js';

export const PREVIEW_LOGIN = { username: 'demo', password: 'demo-preview' };

let seq = 0;
let loggedIn = false;
let products = [];
const STORE_KEY = 'goomarket_preview_v3';

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ seq, products }));
  } catch {
    // Joy tugasa (katta rasmlar) — faqat xotirada qoladi
  }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && Array.isArray(saved.products)) {
      products = saved.products;
      seq = saved.seq || products.reduce((m, p) => Math.max(m, p.id), 0);
      return true;
    }
  } catch {}
  return false;
}

async function seed() {
  const base = Date.now() - (DEMO_PRODUCTS.length + 1) * 3600e3;
  products = DEMO_PRODUCTS.map((p, i) => {
    const { data } = validateProduct({ ...p, status: 'active', featured: false });
    const at = new Date(base + i * 3600e3).toISOString();
    return { id: ++seq, ...data, createdAt: at, updatedAt: at };
  });
  // To'liq landing sahifali namuna: Pods Pro 2 Premium (eng yangi bo'lib turadi)
  const { podsExample } = await import('./podsExample.js');
  const { data, errors } = validateProduct(podsExample, { isImage, isVideo });
  if (data) {
    const at = new Date().toISOString();
    products.unshift({ id: ++seq, ...data, createdAt: at, updatedAt: at });
  } else {
    console.warn('Pods namunasi yuklanmadi', errors);
  }
  persist();
}
const ready = PREVIEW ? (restore() ? Promise.resolve() : seed()) : Promise.resolve();

function isImage(u) {
  return /^data:image\/(png|jpeg|webp);base64,/.test(u) || /^blob:/.test(u);
}
function isVideo(u) {
  return /^blob:/.test(u) || /^data:video\//.test(u);
}

const toPublic = (p) => ({
  id: p.id,
  slug: p.slug,
  name: { uz: p.nameUz, ru: p.nameRu },
  desc: { uz: p.descUz, ru: p.descRu },
  price: p.price,
  oldPrice: p.oldPrice,
  image: p.mainImage,
  gallery: p.gallery,
  category: p.category,
  features: p.features,
  uzumUrl: p.uzumUrl,
  featured: p.featured,
  createdAt: p.createdAt,
  tagline: { uz: p.taglineUz || '', ru: p.taglineRu || '' },
  soldCount: p.soldCount ?? null,
  reviewCount: p.reviewCount ?? null,
  rating: p.rating ?? null,
  videoUrl: p.videoUrl || null,
  videoPoster: p.videoPoster || null,
  sections: p.sections || [],
  comparison: p.comparison || null,
});
const toAdmin = (p) => ({ ...toPublic(p), status: p.status, updatedAt: p.updatedAt });
const toInput = (p) => ({ ...p, rating: p.rating ? `${Math.floor(p.rating / 10)}.${p.rating % 10}` : '' });

const ok = (data, status = 200) => ({ status, data });
const fail = (status, error, fields) => ({ status, data: { error, fields } });

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function save(input, existing) {
  const { data, errors } = validateProduct(input, { isImage, isVideo });
  if (!data) return fail(422, 'Ba’zi maydonlar to‘g‘ri to‘ldirilmagan', errors);
  const clash = products.find((p) => p.slug === data.slug && p.id !== existing?.id);
  if (clash) {
    if (existing || String(input.slug || '').trim()) {
      return fail(409, 'Bu manzil boshqa mahsulotda band', { slug: 'Bu manzil boshqa mahsulotda band. Boshqasini yozing' });
    }
    let i = 2;
    while (products.some((p) => p.slug === `${data.slug}-${i}`)) i++;
    data.slug = `${data.slug}-${i}`;
  }
  const now = new Date().toISOString();
  if (existing) {
    Object.assign(existing, data, { updatedAt: now });
    persist();
    return ok({ product: toAdmin(existing) });
  }
  const created = { id: ++seq, ...data, createdAt: now, updatedAt: now };
  products.unshift(created);
  persist();
  return ok({ product: toAdmin(created) }, 201);
}

export async function handleMock({ method, path, body }) {
  await ready;
  await new Promise((r) => setTimeout(r, 120)); // tarmoqqa o'xshash kichik kechikish
  const url = new URL(path, 'http://preview');
  const p = url.pathname;
  let m;

  if (method === 'GET' && p === '/api/products') {
    const list = products
      .filter((x) => x.status === 'active')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    return ok({ products: list.map(toPublic) });
  }
  if (method === 'GET' && (m = p.match(/^\/api\/products\/([^/]+)$/))) {
    const found = products.find((x) => x.slug === decodeURIComponent(m[1]) && x.status === 'active');
    return found ? ok({ product: toPublic(found) }) : fail(404, 'Mahsulot topilmadi');
  }

  if (p === '/api/admin/setup-status') return ok({ setupRequired: false });
  if (p === '/api/admin/login' && method === 'POST') {
    if (body?.username === PREVIEW_LOGIN.username && body?.password === PREVIEW_LOGIN.password) {
      loggedIn = true;
      return ok({ admin: { username: 'demo' } });
    }
    return fail(401, 'Login yoki parol noto‘g‘ri');
  }
  if (p === '/api/admin/logout') {
    loggedIn = false;
    return ok({ ok: true });
  }
  if (!loggedIn) return fail(401, 'Avval tizimga kiring');

  if (p === '/api/admin/session') return ok({ admin: { username: 'demo' } });
  if (p === '/api/admin/examples') return ok({ examples: [] });
  if (p === '/api/admin/stats') {
    const active = products.filter((x) => x.status === 'active');
    return ok({
      total: products.length,
      active: active.length,
      hidden: products.length - active.length,
      missingUzum: active.filter((x) => !x.uzumUrl).length,
      featured: active.filter((x) => x.featured).length,
      recent: [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(toAdmin),
    });
  }
  if (p === '/api/admin/uploads' && method === 'POST') {
    if (!(body instanceof Blob) || !/^image\/(png|jpeg|webp)$/.test(body.type)) {
      return fail(415, 'Faqat JPG, PNG yoki WEBP rasm yuklash mumkin');
    }
    return ok({ url: await blobToDataUrl(body) }, 201);
  }
  if (p === '/api/admin/products') {
    if (method === 'GET') {
      return ok({
        products: [...products].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toAdmin),
        categories: CATEGORY_IDS,
      });
    }
    if (method === 'POST') return save(body);
  }
  if ((m = p.match(/^\/api\/admin\/products\/(\d+)$/))) {
    const item = products.find((x) => x.id === Number(m[1]));
    if (!item) return fail(404, 'Mahsulot topilmadi');
    if (method === 'GET') return ok({ product: toAdmin(item) });
    if (method === 'PUT') return save(body, item);
    if (method === 'PATCH') {
      const allowed = ['price', 'oldPrice', 'status', 'featured'];
      const patch = Object.fromEntries(Object.entries(body || {}).filter(([k]) => allowed.includes(k)));
      return save({ ...toInput(item), ...patch }, item);
    }
    if (method === 'DELETE') {
      products = products.filter((x) => x !== item);
      persist();
      return ok({ ok: true });
    }
  }
  return fail(404, 'Topilmadi');
}
