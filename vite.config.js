import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const preview = process.env.GOOMARKET_PREVIEW === '1';

export default defineConfig({
  plugins: [react()],
  // Sayt domen ildizida ishlaydi (/product/..., /admin/...)
  base: preview ? './' : '/',
  define: {
    // Ko'rgazma rejimi: serversiz, ma'lumotlar faqat brauzer xotirasida (faqat ko'rib chiqish uchun)
    __PREVIEW__: JSON.stringify(preview),
  },
  server: {
    // "npm run dev" paytida API so'rovlari "npm run server" ga yo'naltiriladi
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  build: {
    target: 'es2019',
    cssCodeSplit: false,
  },
});
