// =====================================================================
//  Tayyor namunaviy mahsulotlar (examples/<nom>/product.json + rasmlar).
//  Admin paneldan ham (terminalsiz hostinglar uchun), terminaldan ham
//  (npm run import-example) qo'shiladi. Mahsulot YASHIRILGAN holda qo'shiladi.
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.js';
import { db } from './db.js';
import { validateProduct } from '../shared/product-schema.js';
import { createProduct } from './products-repo.js';
import { saveImage } from './uploads.js';

const DIR = path.join(ROOT, 'examples');

function readSpec(id) {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const file = path.join(DIR, id, 'product.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function slugTaken(slug) {
  return Boolean(
    db.prepare('SELECT 1 FROM products WHERE slug = ?').get(slug) || db.prepare('SELECT 1 FROM product_slugs WHERE slug = ?').get(slug),
  );
}

export function listExamples() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .map((id) => {
      const spec = readSpec(id);
      if (!spec) return null;
      return { id, name: spec.nameUz, image: spec.mainImage, imported: slugTaken(spec.slug) };
    })
    .filter(Boolean);
}

export function examplePreviewPath(id, file) {
  const spec = readSpec(id);
  if (!spec || !/^[\w.-]+\.(webp|jpg|png)$/.test(file)) return null;
  const p = path.join(DIR, id, file);
  return p.startsWith(path.join(DIR, id) + path.sep) && fs.existsSync(p) ? p : null;
}

/**
 * @returns {{ product?: object, errors?: Record<string,string> }}
 */
export function importExample(id, { price, oldPrice, uzumUrl } = {}) {
  const spec = readSpec(id);
  if (!spec) return { errors: { example: 'Namuna topilmadi' } };

  const uploaded = new Map();
  const upload = (file) => {
    if (!file) return null;
    if (!uploaded.has(file)) {
      const url = saveImage(fs.readFileSync(path.join(DIR, id, file)));
      if (!url) throw new Error(`Rasm o‘qilmadi: ${file}`);
      uploaded.set(file, url);
    }
    return uploaded.get(file);
  };

  // Avval narx va havolani tekshiramiz — rasmlarni behuda yuklamaslik uchun
  const precheck = validateProduct({ ...spec, price, oldPrice, uzumUrl, mainImage: null, gallery: [], sections: [], comparison: null });
  const fieldErrors = Object.fromEntries(Object.entries(precheck.errors).filter(([k]) => ['price', 'oldPrice', 'uzumUrl'].includes(k)));
  if (Object.keys(fieldErrors).length) return { errors: fieldErrors };

  const input = {
    ...spec,
    price,
    oldPrice,
    uzumUrl,
    status: 'hidden',
    featured: true,
    mainImage: upload(spec.mainImage),
    gallery: (spec.gallery || []).map(upload),
    sections: (spec.sections || []).map((s) => ({ ...s, images: s.images.map(upload) })),
    comparison: spec.comparison
      ? { ...spec.comparison, cheapImage: upload(spec.comparison.cheapImage), premiumImage: upload(spec.comparison.premiumImage) }
      : null,
  };
  const { data, errors } = validateProduct(input);
  if (!data) return { errors };
  return { product: createProduct(data, { slugExplicit: false }) };
}
