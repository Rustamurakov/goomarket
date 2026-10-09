import { db, nowIso, transaction } from './db.js';
import { slugify } from '../shared/product-schema.js';

export class ConflictError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

/** Ommaviy sayt uchun ko'rinish: holat va xizmat maydonlarisiz */
export function toPublic(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: { uz: row.name_uz, ru: row.name_ru },
    desc: { uz: row.desc_uz, ru: row.desc_ru },
    price: row.price,
    oldPrice: row.old_price ?? null,
    image: row.main_image || null,
    gallery: parseJson(row.gallery, []),
    category: row.category,
    features: parseJson(row.features, []),
    uzumUrl: row.uzum_url || null,
    featured: row.featured === 1,
    createdAt: row.created_at,
    tagline: { uz: row.tagline_uz || '', ru: row.tagline_ru || '' },
    soldCount: row.sold_count ?? null,
    reviewCount: row.review_count ?? null,
    rating: row.rating ?? null,
    videoUrl: row.video_url || null,
    videoPoster: row.video_poster || null,
    sections: parseJson(row.sections, []),
    comparison: row.comparison ? parseJson(row.comparison, null) : null,
  };
}

/** Admin panel uchun to'liq ko'rinish */
export function toAdmin(row) {
  return { ...toPublic(row), status: row.status, updatedAt: row.updated_at };
}

// Yangi qo'shilgan mahsulotlar birinchi ko'rinadi
const ORDER = 'ORDER BY created_at DESC, id DESC';

export function listActive() {
  return db.prepare(`SELECT * FROM products WHERE status = 'active' ${ORDER}`).all().map(toPublic);
}

export function listAll() {
  return db.prepare('SELECT * FROM products ORDER BY updated_at DESC, id DESC').all().map(toAdmin);
}

export function getRowById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id) || null;
}

/**
 * Slug bo'yicha faol mahsulotni topadi.
 * @returns {{product?: object, redirect?: string} | null}
 */
export function findActiveBySlug(slug) {
  const row = db.prepare(`SELECT * FROM products WHERE slug = ? AND status = 'active'`).get(slug);
  if (row) return { product: toPublic(row) };
  const old = db
    .prepare(
      `SELECT p.slug FROM product_slugs s JOIN products p ON p.id = s.product_id
       WHERE s.slug = ? AND p.status = 'active'`,
    )
    .get(slug);
  if (old) return { redirect: old.slug };
  return null;
}

function slugOwner(slug) {
  const live = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (live) return live.id;
  const old = db.prepare('SELECT product_id FROM product_slugs WHERE slug = ?').get(slug);
  return old ? old.product_id : null;
}

function uniqueSlug(base, selfId = null) {
  let candidate = base;
  for (let i = 2; i < 1000; i++) {
    const owner = slugOwner(candidate);
    if (owner === null || owner === selfId) return candidate;
    candidate = `${base}-${i}`.slice(0, 80);
  }
  return `${base}-${Date.now()}`;
}

const params = (d) => [
  d.slug,
  d.nameUz,
  d.nameRu,
  d.price,
  d.oldPrice ?? null,
  d.mainImage ?? null,
  JSON.stringify(d.gallery || []),
  d.descUz || '',
  d.descRu || '',
  d.category,
  JSON.stringify(d.features || []),
  d.uzumUrl ?? null,
  d.status,
  d.featured ? 1 : 0,
  d.taglineUz || '',
  d.taglineRu || '',
  d.soldCount ?? null,
  d.reviewCount ?? null,
  d.rating ?? null,
  d.videoUrl ?? null,
  d.videoPoster ?? null,
  JSON.stringify(d.sections || []),
  d.comparison ? JSON.stringify(d.comparison) : null,
];

/**
 * @param {object} data — validateProduct() natijasi
 * @param {{slugExplicit: boolean}} opts — admin slugni o'zi yozganmi
 */
export function createProduct(data, { slugExplicit }) {
  return transaction(() => {
    let slug = data.slug;
    if (slugOwner(slug) !== null) {
      if (slugExplicit) throw new ConflictError('slug', 'Bu manzil boshqa mahsulotda band. Boshqasini yozing');
      slug = uniqueSlug(slug);
    }
    const now = nowIso();
    const res = db
      .prepare(
        `INSERT INTO products (slug, name_uz, name_ru, price, old_price, main_image, gallery, desc_uz, desc_ru,
           category, features, uzum_url, status, featured,
           tagline_uz, tagline_ru, sold_count, review_count, rating, video_url, video_poster, sections, comparison,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(...params({ ...data, slug }), now, now);
    return toAdmin(getRowById(Number(res.lastInsertRowid)));
  });
}

export function updateProduct(id, data) {
  return transaction(() => {
    const existing = getRowById(id);
    if (!existing) return null;

    const owner = slugOwner(data.slug);
    if (owner !== null && owner !== id) {
      throw new ConflictError('slug', 'Bu manzil boshqa mahsulotda band. Boshqasini yozing');
    }
    if (data.slug !== existing.slug) {
      // Eski manzil saqlanadi — Instagram'dagi eski havolalar ishlashda davom etadi
      db.prepare('INSERT OR REPLACE INTO product_slugs (slug, product_id) VALUES (?, ?)').run(existing.slug, id);
      db.prepare('DELETE FROM product_slugs WHERE slug = ?').run(data.slug);
    }

    db.prepare(
      `UPDATE products SET slug = ?, name_uz = ?, name_ru = ?, price = ?, old_price = ?, main_image = ?, gallery = ?,
         desc_uz = ?, desc_ru = ?, category = ?, features = ?, uzum_url = ?, status = ?, featured = ?,
         tagline_uz = ?, tagline_ru = ?, sold_count = ?, review_count = ?, rating = ?, video_url = ?, video_poster = ?,
         sections = ?, comparison = ?, updated_at = ?
       WHERE id = ?`,
    ).run(...params(data), nowIso(), id);
    return toAdmin(getRowById(id));
  });
}

/** Mavjud yozuvni validateProduct() kiradigan formatga o'giradi (qisman yangilash uchun) */
export function rowToInput(row) {
  return {
    nameUz: row.name_uz,
    nameRu: row.name_ru,
    slug: row.slug,
    price: row.price,
    oldPrice: row.old_price,
    mainImage: row.main_image,
    gallery: parseJson(row.gallery, []),
    descUz: row.desc_uz,
    descRu: row.desc_ru,
    category: row.category,
    features: parseJson(row.features, []),
    uzumUrl: row.uzum_url,
    status: row.status,
    featured: row.featured === 1,
    taglineUz: row.tagline_uz || '',
    taglineRu: row.tagline_ru || '',
    soldCount: row.sold_count ?? null,
    reviewCount: row.review_count ?? null,
    rating: row.rating != null ? `${Math.floor(row.rating / 10)}.${row.rating % 10}` : null,
    videoUrl: row.video_url,
    videoPoster: row.video_poster,
    sections: parseJson(row.sections, []),
    comparison: row.comparison ? parseJson(row.comparison, null) : null,
  };
}

export function deleteProduct(id) {
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return res.changes > 0;
}

export function stats() {
  const counts = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(status = 'active') AS active,
              SUM(status = 'hidden') AS hidden,
              SUM(status = 'active' AND (uzum_url IS NULL OR uzum_url = '')) AS missing_uzum,
              SUM(featured = 1 AND status = 'active') AS featured
       FROM products`,
    )
    .get();
  const recent = db.prepare('SELECT * FROM products ORDER BY created_at DESC, id DESC LIMIT 5').all().map(toAdmin);
  return {
    total: counts.total || 0,
    active: counts.active || 0,
    hidden: counts.hidden || 0,
    missingUzum: counts.missing_uzum || 0,
    featured: counts.featured || 0,
    recent,
  };
}

/** Bazada ishlatilayotgan barcha rasm manzillari (keraksiz fayllarni tozalash uchun) */
export function referencedImages() {
  const set = new Set();
  for (const row of db.prepare('SELECT main_image, gallery, video_url, video_poster, sections, comparison FROM products').all()) {
    for (const url of fileUrls(row)) set.add(url);
  }
  return set;
}

export { slugify };

/** Mahsulotga tegishli barcha yuklangan fayllar (rasmlar, video, bo'lim rasmlari) */
export function fileUrls(row) {
  const out = [];
  if (row.main_image) out.push(row.main_image);
  out.push(...parseJson(row.gallery, []));
  if (row.video_url && row.video_url.startsWith('/uploads/')) out.push(row.video_url);
  if (row.video_poster) out.push(row.video_poster);
  for (const s of parseJson(row.sections, [])) out.push(...(s.images || []));
  const cmp = row.comparison ? parseJson(row.comparison, null) : null;
  if (cmp) out.push(cmp.cheapImage, cmp.premiumImage);
  return out.filter(Boolean);
}
