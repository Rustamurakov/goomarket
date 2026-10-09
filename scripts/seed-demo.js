// =====================================================================
//  Bazaga namunaviy mahsulotlarni qo'shish (ixtiyoriy).
//  Ishlatish:  npm run seed-demo
//  Mahsulotlar YASHIRILGAN holda qo'shiladi — ommaviy saytda ko'rinmaydi.
//  Ularni admin paneldan tahrirlab, haqiqiy narx va Uzum havolasini
//  kiritib, keyin "Faol" qilishingiz yoki o'chirib yuborishingiz mumkin.
// =====================================================================
import { DEMO_PRODUCTS } from '../shared/demo-products.js';
import { validateProduct } from '../shared/product-schema.js';
import { createProduct } from '../server/products-repo.js';
import { db } from '../server/db.js';

const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
if (count > 0 && !process.argv.includes('--force')) {
  console.log(`Bazada allaqachon ${count} ta mahsulot bor. Namunalar qo‘shilmadi.`);
  console.log('Baribir qo‘shish uchun:  npm run seed-demo -- --force');
  process.exit(0);
}

let added = 0;
for (const item of DEMO_PRODUCTS) {
  const { data, errors } = validateProduct({ ...item, status: 'hidden' });
  if (!data) {
    console.warn('O‘tkazib yuborildi:', item.nameUz, errors);
    continue;
  }
  createProduct(data, { slugExplicit: false });
  added++;
}
console.log(`✅ ${added} ta namunaviy mahsulot yashirilgan holda qo‘shildi.`);
