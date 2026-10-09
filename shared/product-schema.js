// =====================================================================
//  Mahsulot ma'lumotlari sxemasi va tekshiruvi.
//  Bu fayl ham serverda (server/), ham brauzerda ishlatiladi —
//  shuning uchun qoidalar bitta joyda va bir xil.
//  Narxlar butun son ko'rinishida (so'mda) saqlanadi: suzuvchi nuqta yo'q.
// =====================================================================

export const CATEGORY_IDS = ['earbuds', 'cases', 'chargers', 'cables', 'powerbanks', 'other'];
export const STATUSES = ['active', 'hidden'];

export const LIMITS = {
  name: 120,
  slug: 80,
  desc: 5000,
  feature: 200,
  features: 20,
  gallery: 8,
  maxPrice: 1_000_000_000, // 1 mlrd so'm
  tagline: 160,
  sections: 12,
  sectionImages: 2,
  sectionTitle: 120,
  sectionText: 1500,
  maxCount: 100_000_000,
  compareRows: 12,
  compareText: 160,
};

const SERVER_IMAGE = /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/;
const SERVER_VIDEO = /^\/uploads\/[a-f0-9]{32}\.(mp4|webm|mov)$/;

/** YouTube havolasidan video ID ni ajratadi (watch, youtu.be, shorts, embed) */
export function youtubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else id = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] || null;
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const isServerVideo = (u) => SERVER_VIDEO.test(String(u || ''));

/** "4.8", "4,8", 4.8 → 48 (o'ndan birlarda, suzuvchi nuqtasiz); bo'sh → null; noto'g'ri → NaN */
export function parseRating(value) {
  if (value === '' || value == null) return null;
  const m = String(value).trim().replace(',', '.').match(/^([1-5])(?:\.(\d))?$/);
  if (!m) return NaN;
  const tenths = Number(m[1]) * 10 + Number(m[2] || 0);
  return tenths >= 10 && tenths <= 50 ? tenths : NaN;
}

export const formatRating = (tenths) => (tenths ? `${Math.floor(tenths / 10)}.${tenths % 10}` : '');

function parseCount(value) {
  if (value === '' || value == null) return null;
  const n = parsePrice(value);
  return Number.isInteger(n) && n >= 0 && n <= LIMITS.maxCount ? n : NaN;
}

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

/** "Silikon g‘ilof Soft Touch" → "silikon-gilof-soft-touch" */
export function slugify(input = '') {
  return String(input)
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, '')
    .split('')
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.slug)
    .replace(/-+$/g, '');
}

export function isValidSlug(slug) {
  return typeof slug === 'string' && slug.length >= 2 && slug.length <= LIMITS.slug && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/** "249 000", "249000", 249000 → 249000; noto'g'ri qiymat → NaN */
export function parsePrice(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  if (typeof value !== 'string') return NaN;
  const clean = value.replace(/[\s _]/g, '').replace(/so['‘’]?m|сум/gi, '');
  if (!/^\d+$/.test(clean)) return NaN;
  return Number(clean);
}

export function isUzumUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (host === 'uzum.uz' || host.endsWith('.uzum.uz'));
  } catch {
    return false;
  }
}

/** Chegirma foizi faqat admin kiritgan eski narx asosida hisoblanadi. */
export function discountPercent(price, oldPrice) {
  if (!Number.isInteger(oldPrice) || !Number.isInteger(price) || oldPrice <= price || oldPrice <= 0) return 0;
  return Math.floor(((oldPrice - price) * 100) / oldPrice);
}

function text(value, max) {
  if (value == null) return '';
  return String(value).replace(/\r\n/g, '\n').trim().slice(0, max + 1);
}

/**
 * Formadan yoki API'dan kelgan ma'lumotni tekshiradi va tozalaydi.
 * @param {object} input
 * @param {object} [opts] { isImage: (url) => boolean }
 * @returns {{ data: object|null, errors: Record<string,string> }}
 */
export function validateProduct(input = {}, opts = {}) {
  const isImage = opts.isImage || ((u) => SERVER_IMAGE.test(u));
  const errors = {};

  const nameUz = text(input.nameUz, LIMITS.name);
  // Ruscha nom bo'sh bo'lsa, o'zbekcha nom ishlatiladi
  const nameRu = text(input.nameRu, LIMITS.name) || nameUz;
  if (!nameUz) errors.nameUz = 'O‘zbekcha nomini kiriting';
  else if (nameUz.length > LIMITS.name) errors.nameUz = `Nom ${LIMITS.name} belgidan oshmasin`;
  if (nameRu.length > LIMITS.name) errors.nameRu = `Nom ${LIMITS.name} belgidan oshmasin`;

  let slug = text(input.slug, LIMITS.slug).toLowerCase();
  if (!slug) slug = slugify(nameUz || nameRu);
  if (!isValidSlug(slug)) {
    errors.slug = 'Manzil faqat lotin kichik harflari, raqamlar va chiziqchadan iborat bo‘lsin (kamida 2 belgi)';
  }

  const price = parsePrice(input.price);
  if (input.price === '' || input.price == null) errors.price = 'Narxni kiriting';
  else if (!Number.isInteger(price) || price < 0) errors.price = 'Narx butun son bo‘lsin (so‘mda, masalan 249000)';
  else if (price > LIMITS.maxPrice) errors.price = 'Narx juda katta';

  let oldPrice = null;
  if (input.oldPrice !== '' && input.oldPrice != null) {
    oldPrice = parsePrice(input.oldPrice);
    if (!Number.isInteger(oldPrice) || oldPrice < 0) errors.oldPrice = 'Eski narx butun son bo‘lsin';
    else if (Number.isInteger(price) && oldPrice <= price) errors.oldPrice = 'Eski narx joriy narxdan katta bo‘lishi kerak — aks holda bo‘sh qoldiring';
    else if (oldPrice > LIMITS.maxPrice) errors.oldPrice = 'Eski narx juda katta';
  }

  let mainImage = input.mainImage ? String(input.mainImage) : null;
  if (mainImage && !isImage(mainImage)) errors.mainImage = 'Rasm noto‘g‘ri. Qaytadan yuklang';

  const galleryIn = Array.isArray(input.gallery) ? input.gallery.filter(Boolean).map(String) : [];
  const gallery = [...new Set(galleryIn)].filter((g) => g !== mainImage);
  if (gallery.length > LIMITS.gallery) errors.gallery = `Ko‘pi bilan ${LIMITS.gallery} ta qo‘shimcha rasm`;
  else if (gallery.some((g) => !isImage(g))) errors.gallery = 'Qo‘shimcha rasmlardan biri noto‘g‘ri. Qaytadan yuklang';

  const descUz = text(input.descUz, LIMITS.desc);
  const descRu = text(input.descRu, LIMITS.desc);
  if (descUz.length > LIMITS.desc) errors.descUz = `Tavsif ${LIMITS.desc} belgidan oshmasin`;
  if (descRu.length > LIMITS.desc) errors.descRu = `Tavsif ${LIMITS.desc} belgidan oshmasin`;

  const category = String(input.category || '');
  if (!CATEGORY_IDS.includes(category)) errors.category = 'Kategoriyani tanlang';

  const featuresIn = Array.isArray(input.features) ? input.features : [];
  const features = featuresIn
    .map((f) => ({ uz: text(f?.uz, LIMITS.feature), ru: text(f?.ru, LIMITS.feature) }))
    .filter((f) => f.uz || f.ru);
  if (features.length > LIMITS.features) errors.features = `Ko‘pi bilan ${LIMITS.features} ta xususiyat`;
  else if (features.some((f) => f.uz.length > LIMITS.feature || f.ru.length > LIMITS.feature)) {
    errors.features = `Har bir xususiyat ${LIMITS.feature} belgidan oshmasin`;
  }

  let uzumUrl = text(input.uzumUrl, 1000) || null;
  if (uzumUrl && !isUzumUrl(uzumUrl)) {
    errors.uzumUrl = 'Havola https://uzum.uz/... ko‘rinishida bo‘lsin (Uzum Market’dagi mahsulot sahifasidan nusxa oling)';
  }

  // ---------- Landing sahifa maydonlari ----------
  const taglineUz = text(input.taglineUz, LIMITS.tagline);
  const taglineRu = text(input.taglineRu, LIMITS.tagline);
  if (taglineUz.length > LIMITS.tagline) errors.taglineUz = `Shior ${LIMITS.tagline} belgidan oshmasin`;
  if (taglineRu.length > LIMITS.tagline) errors.taglineRu = `Shior ${LIMITS.tagline} belgidan oshmasin`;

  const soldCount = parseCount(input.soldCount);
  if (Number.isNaN(soldCount)) errors.soldCount = 'Butun son kiriting, masalan 27000';
  const reviewCount = parseCount(input.reviewCount);
  if (Number.isNaN(reviewCount)) errors.reviewCount = 'Butun son kiriting, masalan 10000';
  const rating = parseRating(input.rating);
  if (Number.isNaN(rating)) errors.rating = 'Reyting 1 dan 5 gacha, masalan 4.8';

  const isVideo = opts.isVideo || isServerVideo;
  let videoUrl = text(input.videoUrl, 1000) || null;
  if (videoUrl) {
    const yt = youtubeId(videoUrl);
    if (yt) videoUrl = `https://www.youtube.com/watch?v=${yt}`;
    else if (!isVideo(videoUrl)) errors.videoUrl = 'Video faylini qayta yuklang yoki YouTube havolasini kiriting';
  }
  let videoPoster = input.videoPoster ? String(input.videoPoster) : null;
  if (videoPoster && !isImage(videoPoster)) errors.videoPoster = 'Muqova rasmi noto‘g‘ri. Qaytadan yuklang';
  if (!videoUrl) videoPoster = null;

  const sectionsIn = Array.isArray(input.sections) ? input.sections : [];
  const sections = sectionsIn
    .map((s) => ({
      images: (Array.isArray(s?.images) ? s.images : []).filter(Boolean).map(String).slice(0, LIMITS.sectionImages + 1),
      titleUz: text(s?.titleUz, LIMITS.sectionTitle),
      titleRu: text(s?.titleRu, LIMITS.sectionTitle),
      textUz: text(s?.textUz, LIMITS.sectionText),
      textRu: text(s?.textRu, LIMITS.sectionText),
    }))
    .filter((s) => s.images.length || s.titleUz || s.titleRu || s.textUz || s.textRu);
  if (sections.length > LIMITS.sections) errors.sections = `Ko‘pi bilan ${LIMITS.sections} ta bo‘lim`;
  else {
    sections.forEach((s, i) => {
      if (errors.sections) return;
      if (s.images.length > LIMITS.sectionImages) errors.sections = `${i + 1}-bo‘lim: ko‘pi bilan ${LIMITS.sectionImages} ta rasm`;
      else if (s.images.some((u) => !isImage(u))) errors.sections = `${i + 1}-bo‘lim: rasm noto‘g‘ri, qayta yuklang`;
      else if (!s.titleUz && !s.titleRu) errors.sections = `${i + 1}-bo‘lim: sarlavhani kiriting`;
      else if (s.titleUz.length > LIMITS.sectionTitle || s.titleRu.length > LIMITS.sectionTitle) errors.sections = `${i + 1}-bo‘lim: sarlavha juda uzun`;
      else if (s.textUz.length > LIMITS.sectionText || s.textRu.length > LIMITS.sectionText) errors.sections = `${i + 1}-bo‘lim: matn juda uzun`;
    });
  }

  // ---------- Taqqoslash: arzon analog va premium mahsulot ----------
  let comparison = null;
  const cIn = input.comparison && typeof input.comparison === 'object' ? input.comparison : null;
  if (cIn) {
    const T = LIMITS.compareText;
    const c = {
      titleUz: text(cIn.titleUz, T),
      titleRu: text(cIn.titleRu, T),
      cheapLabelUz: text(cIn.cheapLabelUz, 60),
      cheapLabelRu: text(cIn.cheapLabelRu, 60),
      premiumLabelUz: text(cIn.premiumLabelUz, 60),
      premiumLabelRu: text(cIn.premiumLabelRu, 60),
      cheapImage: cIn.cheapImage ? String(cIn.cheapImage) : null,
      premiumImage: cIn.premiumImage ? String(cIn.premiumImage) : null,
      rows: (Array.isArray(cIn.rows) ? cIn.rows : [])
        .map((r) => ({
          aspectUz: text(r?.aspectUz, T),
          aspectRu: text(r?.aspectRu, T),
          cheapUz: text(r?.cheapUz, T),
          cheapRu: text(r?.cheapRu, T),
          premiumUz: text(r?.premiumUz, T),
          premiumRu: text(r?.premiumRu, T),
        }))
        .filter((r) => Object.values(r).some(Boolean)),
    };
    const longText = [c.titleUz, c.titleRu].some((v) => v.length > T) || [c.cheapLabelUz, c.cheapLabelRu, c.premiumLabelUz, c.premiumLabelRu].some((v) => v.length > 60);
    if (c.rows.length > LIMITS.compareRows) errors.comparison = `Taqqoslashda ko‘pi bilan ${LIMITS.compareRows} ta qator`;
    else if (longText) errors.comparison = 'Taqqoslash sarlavhasi yoki nomlari juda uzun';
    else if ([c.cheapImage, c.premiumImage].some((u) => u && !isImage(u))) errors.comparison = 'Taqqoslash rasmi noto‘g‘ri, qayta yuklang';
    else {
      c.rows.forEach((r, i) => {
        if (errors.comparison) return;
        if (Object.values(r).some((v) => v.length > T)) errors.comparison = `Taqqoslash ${i + 1}-qator: matn juda uzun`;
        else if (!r.aspectUz && !r.aspectRu) errors.comparison = `Taqqoslash ${i + 1}-qator: nimani solishtirayotganingizni yozing (masalan “Shovqinni qaytarish”)`;
        else if (!r.premiumUz && !r.premiumRu) errors.comparison = `Taqqoslash ${i + 1}-qator: premium mahsulot ustunini to‘ldiring`;
      });
    }
    if (c.rows.length) comparison = c;
  }

  const status = STATUSES.includes(input.status) ? input.status : 'active';
  const featured = input.featured === true || input.featured === 1 || input.featured === 'true';

  if (Object.keys(errors).length) return { data: null, errors };
  return {
    data: {
      nameUz, nameRu, slug, price, oldPrice, mainImage, gallery, descUz, descRu, category, features, uzumUrl, status, featured,
      taglineUz, taglineRu, soldCount, reviewCount, rating, videoUrl, videoPoster, sections, comparison,
    },
    errors: {},
  };
}
