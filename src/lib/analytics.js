import { ANALYTICS, SITE } from '../config/site.js';

// =====================================================================
//  UTM va o'tishlar analitikasi
//  - Saytga birinchi kirishda UTM belgilar (utm_source, utm_campaign …)
//    va fbclid sessiyada saqlanadi.
//  - "Uzum Market'da xarid qilish" bosilganda hodisa window.dataLayer'ga
//    yoziladi (GTM / GA4 uchun) va Meta Pixel ulangan bo'lsa, unga ham.
//  - Bu faqat saytdan Uzum'ga O'TISHNI kuzatadi. Uzum Market'dagi
//    buyurtma yoki sotuvlar bu yerda kuzatilmaydi.
// =====================================================================

const KEY = 'goomarket_utm';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const EXTRA_KEYS = ['fbclid'];

export function captureUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    [...UTM_KEYS, ...EXTRA_KEYS].forEach((k) => {
      const v = params.get(k);
      if (v) found[k] = v;
    });
    if (Object.keys(found).length) {
      found.landing_at = new Date().toISOString();
      sessionStorage.setItem(KEY, JSON.stringify(found));
    }
  } catch {}
}

export function getUtm() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

const UZUM_FALLBACK = 'https://uzum.uz/';

/** Mahsulot uchun Uzum Market havolasini qaytaradi (UTM bilan). */
export function buildUzumUrl(product) {
  const base = product?.uzumUrl || SITE.uzumShopUrl || UZUM_FALLBACK;
  if (!ANALYTICS.appendUtmToOutbound) return base;
  try {
    const url = new URL(base);
    const utm = getUtm();
    // Mijoz reklama orqali kelgan bo'lsa — o'sha belgilar, aks holda standart belgilar
    const hasLandingUtm = UTM_KEYS.some((k) => utm[k]);
    const merged = {};
    if (hasLandingUtm) UTM_KEYS.forEach((k) => utm[k] && (merged[k] = utm[k]));
    else Object.assign(merged, ANALYTICS.defaultOutboundUtm);
    if (product?.id) merged.utm_content = merged.utm_content || product.id;
    Object.entries(merged).forEach(([k, v]) => {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    });
    return url.toString();
  } catch {
    return base;
  }
}

export function trackEvent(name, payload = {}) {
  const data = { event: name, ...payload, ...prefixUtm(getUtm()) };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  } catch {}
  try {
    if (typeof window.fbq === 'function') window.fbq('trackCustom', name, data);
  } catch {}
  if (import.meta.env?.DEV) console.info('[analytics]', data);
}

export function trackOutbound(product, placement) {
  trackEvent(ANALYTICS.outboundEventName, {
    product_id: product?.id,
    product_category: product?.category,
    placement,
    has_real_link: Boolean(product?.uzumUrl),
  });
}

function prefixUtm(utm) {
  const out = {};
  Object.entries(utm).forEach(([k, v]) => (out[`landing_${k}`] = v));
  return out;
}
