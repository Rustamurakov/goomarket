// Ko'rgazma rejimi uchun Pods Pro 2 Premium namunasi (rasmlar ichiga joylangan).
// Haqiqiy saytda ishlatilmaydi — u yerda "npm run import-example" bilan qo'shiladi.
import spec from '../../examples/pods-pro-2/product.json';
import i1 from '../../examples/pods-pro-2/01-case.webp';
import i2 from '../../examples/pods-pro-2/02-buds.webp';
import i3 from '../../examples/pods-pro-2/03-anc.webp';
import i4 from '../../examples/pods-pro-2/04-tips.webp';
import i5 from '../../examples/pods-pro-2/05-man.webp';
import i6 from '../../examples/pods-pro-2/06-woman.webp';

const files = {
  '01-case.webp': i1,
  '02-buds.webp': i2,
  '03-anc.webp': i3,
  '04-tips.webp': i4,
  '05-man.webp': i5,
  '06-woman.webp': i6,
};

export const podsExample = {
  ...spec,
  // ⚠️ Faqat ko'rgazma uchun vaqtinchalik qiymatlar — haqiqiy narx va havola admin paneldan kiritiladi
  price: 199000,
  uzumUrl: 'https://uzum.uz/uz',
  status: 'active',
  featured: true,
  mainImage: files[spec.mainImage],
  gallery: spec.gallery.map((f) => files[f]),
  sections: spec.sections.map((s) => ({ ...s, images: s.images.map((f) => files[f]) })),
  comparison: {
    ...spec.comparison,
    cheapImage: spec.comparison.cheapImage ? files[spec.comparison.cheapImage] : null,
    premiumImage: spec.comparison.premiumImage ? files[spec.comparison.premiumImage] : null,
  },
};
