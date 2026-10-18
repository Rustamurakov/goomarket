import { useEffect, useState } from 'react';
import { PREVIEW } from './env.js';

// =====================================================================
//  Yengil router.
//  Oddiy rejimda haqiqiy manzillar ishlatiladi: /product/slug, /admin ...
//  (server barcha sahifalar uchun index.html qaytaradi).
//  Ko'rgazma rejimida (serversiz) manzillar #/... ko'rinishida bo'ladi.
//  Holat xotirada ham saqlanadi — brauzer tarixga yozishni taqiqlasa ham ishlaydi.
// =====================================================================

const MODE = PREVIEW ? 'hash' : 'history';

export const ROUTES = {
  home: '/',
  products: '/products',
  about: '/about',
  contact: '/contact',
  product: (slug) => `/product/${encodeURIComponent(slug)}`,
  admin: '/admin',
  adminLogin: '/admin/login',
  adminSetup: '/admin/setup',
  adminProducts: '/admin/products',
  adminNew: '/admin/products/new',
  adminEdit: (id) => `/admin/products/${id}/edit`,
};

function parse(raw) {
  const clean = raw || '/';
  if (!clean.startsWith('/')) return { path: '/', query: new URLSearchParams() };
  const [path, qs = ''] = clean.split('?');
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return { path: normalized || '/', query: new URLSearchParams(qs) };
}

function readLocation() {
  try {
    if (MODE === 'hash') return parse(window.location.hash.replace(/^#/, ''));
    // Eski versiyadagi #/products kabi havolalarni yangi manzilga o'tkazish
    if (window.location.hash.startsWith('#/')) {
      const legacy = window.location.hash.slice(1);
      try {
        window.history.replaceState(null, '', legacy);
      } catch {}
      return parse(legacy);
    }
    return parse(window.location.pathname + window.location.search);
  } catch {
    return parse('/');
  }
}

let current = readLocation();
const listeners = new Set();

function emit(next) {
  current = next;
  listeners.forEach((fn) => fn(current));
}

/** Sahifa almashganda chaqiriladi (analitika uchun). Obunani bekor qiluvchi funksiya qaytaradi. */
export function onRouteChange(fn) {
  const wrapped = (r) => fn(r);
  listeners.add(wrapped);
  return () => listeners.delete(wrapped);
}

export const hrefFor = (to) => (MODE === 'hash' ? `#${to}` : to);

function write(to, replace) {
  try {
    const url = hrefFor(to);
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  } catch {
    // Muhit manzilni o'zgartirishga ruxsat bermasa — xotiradagi holat yetarli
  }
}

if (typeof window !== 'undefined') {
  const sync = () => {
    const next = readLocation();
    if (next.path !== current.path || next.query.toString() !== current.query.toString()) emit(next);
  };
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
}

// Saqlanmagan o'zgarishlar bo'lsa, sahifadan chiqishdan oldin so'rash uchun
let leaveGuard = null;
export function setLeaveGuard(fn) {
  leaveGuard = fn;
}

export function useRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    listeners.add(setRoute);
    setRoute(current);
    return () => listeners.delete(setRoute);
  }, []);
  return route;
}

export function navigate(to, { replace = false, force = false } = {}) {
  if (!force && leaveGuard && !leaveGuard(to)) return;
  write(to, replace);
  emit(parse(to));
}

/** Manzilni tarixga yozmasdan yangilash (filtrlar uchun) */
export function replaceQuietly(to) {
  write(to, true);
  current = parse(to);
}

/** "/admin/products/:id/edit" kabi namunani tekshiradi */
export function matchPath(pattern, path) {
  const keys = [];
  const re = new RegExp(
    `^${pattern.replace(/:(\w+)/g, (_, k) => {
      keys.push(k);
      return '([^/]+)';
    })}$`,
  );
  const m = path.match(re);
  if (!m) return null;
  return Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
}

export function Link({ to, children, onClick, target, ...rest }) {
  return (
    <a
      href={hrefFor(to)}
      target={target}
      onClick={(e) => {
        onClick?.(e);
        if (target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
