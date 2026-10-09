// =====================================================================
//  Administrator yaratish yoki parolini almashtirish.
//  Ishlatish:  npm run create-admin
//  Parol kod ichida ham, terminal tarixida ham saqlanmaydi:
//  u yashirin holda so'raladi va bazaga faqat scrypt hashi yoziladi.
// =====================================================================
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { adminCount, createOrUpdateAdmin, validateCredentials, PASSWORD_MIN } from '../server/auth.js';

// Bitta readline interfeysi: parol yozilayotganda ekranga chiqarish o'chiriladi
let muted = false;
const output = new Writable({
  write(chunk, enc, cb) {
    if (!muted) process.stdout.write(chunk, enc);
    cb();
  },
});
const rl = readline.createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
const lines = rl[Symbol.asyncIterator]();

async function ask(question, { hidden = false } = {}) {
  process.stdout.write(question);
  muted = hidden;
  const { value = '' } = await lines.next();
  muted = false;
  if (hidden || !process.stdin.isTTY) process.stdout.write('\n');
  return value;
}

async function main() {
  console.log('\nGooMarket — administrator sozlash');
  console.log(`Mavjud administratorlar soni: ${adminCount()}\n`);

  const username = (await ask('Login (masalan: admin): ')).trim();
  const password = await ask(`Parol (kamida ${PASSWORD_MIN} belgi, ekranda ko‘rinmaydi): `, { hidden: true });
  const confirm = await ask('Parolni qayta kiriting: ', { hidden: true });

  if (password !== confirm) {
    console.error('\n❌ Parollar mos kelmadi. Qaytadan urinib ko‘ring.');
    process.exit(1);
  }
  const errors = validateCredentials(username, password);
  if (Object.keys(errors).length) {
    console.error('\n❌ ' + Object.values(errors).join('\n❌ '));
    process.exit(1);
  }

  rl.close();
  const result = await createOrUpdateAdmin(username, password);
  console.log(
    result.updated
      ? `\n✅ "${username}" parolini almashtirildi. Eski sessiyalar bekor qilindi.`
      : `\n✅ Administrator "${username}" yaratildi. Endi /admin/login sahifasidan kiring.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Xato:', err.message);
  process.exit(1);
});
