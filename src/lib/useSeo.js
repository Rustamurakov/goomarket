import { useEffect } from 'react';

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, name] = selector.match(/\[(name|property)="([^"]+)"\]/) || [];
    if (key) el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Har bir sahifa uchun <title> va meta tavsiflarni joriy tilda o'rnatadi. */
export function useSeo({ title, desc, lang }) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:locale"]', 'content', lang === 'ru' ? 'ru_RU' : 'uz_UZ');
  }, [title, desc, lang]);
}

export function formatPrice(value, lang) {
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { maximumFractionDigits: 0 })
    .format(value)
    .replace(/,/g, ' ');
}

/** "10 000 mAh" kabi sonlar qatorga bo'linib ketmasligi uchun */
export const keepNumbers = (text = '') => String(text).replace(/(\d) (?=\d{3}\b)/g, '$1\u00a0');
