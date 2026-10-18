// =====================================================================
//  Meta (Facebook / Instagram) Pixel
//  Pixel ID kodga yozilmaydi: hostingda META_PIXEL_ID o'zgaruvchisi
//  berilsa, server uni sahifaga <meta name="gm-meta-pixel"> qilib qo'yadi.
//  Admin panelda Pixel ishlamaydi.
//
//  Yuboriladigan standart hodisalar:
//    PageView         — har bir sahifa ochilganda
//    ViewContent      — mahsulot sahifasi ochilganda
//    InitiateCheckout — "Uzum Market orqali sotib olish" bosilganda
//    Search           — qidiruv
//    Contact          — Instagram / Telegram tugmasi bosilganda
// =====================================================================
import { PREVIEW } from './env.js';
import { onRouteChange } from './router.jsx';

let enabled = false;
const isAdmin = (path) => String(path || '').startsWith('/admin');

export function initMetaPixel() {
  if (PREVIEW || typeof window === 'undefined' || enabled) return;
  const id = document.querySelector('meta[name="gm-meta-pixel"]')?.getAttribute('content');
  if (!id || !/^\d{8,20}$/.test(id) || isAdmin(window.location.pathname)) return;

  // Meta'ning rasmiy yuklovchisi (fbevents.js) bilan bir xil ish qiladi
  if (!window.fbq) {
    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }

  enabled = true;
  window.fbq('init', id);
  window.fbq('track', 'PageView');

  let last = window.location.pathname + window.location.search;
  onRouteChange((route) => {
    const key = route.path + (route.query?.toString() ? `?${route.query}` : '');
    if (key === last || isAdmin(route.path)) return;
    last = key;
    window.fbq('track', 'PageView');
  });
}

const STANDARD = {
  product_view: 'ViewContent',
  uzum_click: 'InitiateCheckout',
  search_submit: 'Search',
  contact_click: 'Contact',
};

/** Sayt hodisasini Meta'ning standart hodisasiga aylantirib yuboradi. */
export function pixelEvent(name, payload = {}) {
  if (!enabled || typeof window.fbq !== 'function') return;
  try {
    const std = STANDARD[name];
    if (std) {
      const params = {};
      if (payload.product_id) {
        params.content_ids = [String(payload.product_id)];
        params.content_type = 'product';
      }
      if (payload.product_name) params.content_name = payload.product_name;
      if (payload.product_category) params.content_category = payload.product_category;
      if (payload.query) params.search_string = payload.query;
      window.fbq('track', std, params);
    } else {
      window.fbq('trackCustom', name, payload);
    }
  } catch {}
}
