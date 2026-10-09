import { translations } from '../i18n/translations.js';

// Matnni solishtirish uchun normallashtirish: katta-kichik harf,
// o‘/o'/oʻ apostroflari va ё/е farqlari qidiruvga xalaqit bermaydi.
export function normalize(str = '') {
  return str
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, '')
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mahsulot nomi (ikkala tilda) va kategoriya nomi bo'yicha qidiruv. */
export function matchProduct(product, query) {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize(
    [
      product.name.uz,
      product.name.ru,
      translations.uz.categories[product.category],
      translations.ru.categories[product.category],
    ].join(' '),
  );
  return q.split(' ').every((word) => haystack.includes(word));
}

export function searchProducts(products, query) {
  return products.filter((p) => matchProduct(p, query));
}
