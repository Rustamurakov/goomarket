// =====================================================================
//  Tayyor namunaviy mahsulotni (rasmlari va landing matnlari bilan)
//  bazaga qo'shish. Buni admin paneldagi "Boshqaruv paneli"dan ham qilsa bo'ladi.
//  Ishlatish:  npm run import-example            (Pods Pro 2 Premium)
//              npm run import-example -- pods-pro-2
// =====================================================================
import readline from 'node:readline';
import { importExample, listExamples } from '../server/examples.js';

const id = process.argv.slice(2).find((a) => !a.startsWith('-')) || 'pods-pro-2';
const example = listExamples().find((e) => e.id === id);
if (!example) {
  console.error(`❌ Namuna topilmadi: examples/${id}/product.json`);
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lines = rl[Symbol.asyncIterator]();
async function ask(q) {
  process.stdout.write(q);
  const { value = '' } = await lines.next();
  if (!process.stdin.isTTY) process.stdout.write('\n');
  return value.trim();
}

console.log(`\n${example.name} — namunani import qilish\n`);
const price = await ask('Narxi, so‘mda (masalan 249000): ');
const oldPrice = await ask('Eski narxi (bo‘lmasa Enter): ');
const uzumUrl = await ask('Uzum Market’dagi mahsulot havolasi (bo‘lmasa Enter): ');
rl.close();

try {
  const { product, errors } = importExample(id, { price, oldPrice, uzumUrl });
  if (!product) {
    console.error('\n❌ Ma’lumotlarda xato:\n  ' + Object.values(errors).join('\n  '));
    process.exit(1);
  }
  console.log(`\n✅ "${product.name.uz}" yashirilgan holda qo‘shildi.`);
  console.log('   Admin panel → Mahsulotlar → tekshiring va "Faol" qiling.');
  console.log(`   Sahifa manzili: /product/${product.slug}\n`);
} catch (err) {
  console.error('❌', err.message);
  process.exit(1);
}
