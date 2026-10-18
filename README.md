# GooMarket — online do‘kon va admin panel

Mobil aksessuarlar do‘koni (UZ / RU). Xaridorlar mahsulotni saytda tanlaydi va xaridni Uzum Market’da rasmiylashtiradi.
Siz esa mahsulotlarni **admin panel** orqali o‘zingiz boshqarasiz: dasturchi kerak emas.

---

## 1. Nimalar bor

**Ommaviy sayt**

- 4 ta sahifa: Bosh sahifa, Mahsulotlar, Biz haqimizda, Biz bilan bog‘lanish.
- Har bir mahsulotning alohida sahifasi: `/product/slug`. Unda galereya, narx (eski narx va chegirma bilan), xususiyatlar, tavsif, Uzum tugmasi va o‘xshash mahsulotlar bor.
- Mahsulot manzili (slug) o‘zgarsa, eski havola avtomatik ravishda yangisiga yo‘naltiriladi. Shuning uchun Instagram’dagi eski havolalar ishlashda davom etadi.
- Instagram va Telegram’da mahsulot havolasi nom va rasm bilan chiroyli ko‘rinadi.
- Uzum havolasi kiritilmagan mahsulotda xarid tugmasi umuman chiqmaydi.
- Yashirilgan mahsulot katalogda, qidiruvda va bosh sahifada ko‘rinmaydi. Uning sahifasi “Mahsulot topilmadi” deb chiqadi.

**Mahsulot landing sahifasi** (`/product/slug`) — Instagram reklamasi uchun:

- Birinchi ekran: galereya (telefonda barmoq bilan suriladi), nom, qisqa shior, “27 000+ sotilgan · 10 000+ sharh”, narx, chegirma va katta xarid tugmasi.
- Uzum Market statistikasi bloki (sotuvlar, sharhlar, reyting): faqat admin kiritgan raqamlar ko‘rsatiladi.
- Video: serverga yuklangan MP4/WEBM/MOV fayl (90 MB gacha) yoki YouTube havolasi.
- Afzalliklar bo‘limlari: rasm + sarlavha + matn, navbatma-navbat joylashadi. 2 ta rasm qo‘yilsa, ular yonma-yon chiqadi.
- Xususiyatlar jadvali, tavsif, “Qanday xarid qilinadi”, savol-javoblar, yakuniy xarid bloki va o‘xshash mahsulotlar.
- Telefonda xarid tugmasi ekrandan chiqib ketganda pastda xarid paneli paydo bo‘ladi.
- To‘ldirilmagan bo‘lim saytda umuman ko‘rinmaydi.

**Admin panel** — `/admin`

- **Boshqaruv paneli:** jami, faol va yashirilgan mahsulotlar soni, oxirgi qo‘shilganlar, Uzum havolasi yo‘q mahsulotlar haqida ogohlantirish.
- **Mahsulotlar jadvali:** qidiruv, kategoriya va holat bo‘yicha filtr. Narxni jadvalning o‘zida o‘zgartirish mumkin (Enter yoki “Saqlash” tugmasi).
- **Qo‘shish va tahrirlash formasi:** ikki tilda nom va tavsif, slug, narx, eski narx, asosiy va qo‘shimcha rasmlar, kategoriya, xususiyatlar, Uzum havolasi, faol/yashirin holat, “bosh sahifada ko‘rsatish” belgisi.
- **Rasm yuklash:** kompyuter yoki telefondan yuklanadi. Rasm darhol preview qilib ko‘rsatiladi, fayl turi va hajmi tekshiriladi, rasm avtomatik siqiladi (WEBP, 1600 px gacha).
- **O‘chirish:** avval tasdiqlash oynasi chiqadi va unda asosiy tavsiya sifatida **yashirish** taklif qilinadi. Butunlay o‘chirish faqat alohida belgi qo‘yilgandan keyin ishlaydi.
- **Saqlanmagan o‘zgarishlar:** sahifadan chiqishdan oldin ogohlantirish beriladi.

---

## 2. Kompyuterda ishga tushirish

Kerak bo‘ladi: **Node.js 22.13 yoki yangiroq** ([nodejs.org](https://nodejs.org), “LTS” versiyasi).

```bash
npm install          # bir marta
npm run build        # saytni yig'ish
npm start            # serverni ishga tushirish → http://localhost:3000
```

Server birinchi marta ishga tushganda `data/` papkasi yaratiladi. Unda ma’lumotlar bazasi (`goomarket.db`) va yuklangan rasmlar (`uploads/`) saqlanadi.

Dizayn yoki kod ustida ishlayotganda bitta terminalda `npm run server`, ikkinchisida `npm run dev` ni ishga tushiring. Keyin http://localhost:5173 manzilini oching.

---

## 3. Birinchi administratorni yaratish

Standart parol **yo‘q**: uni o‘zingiz o‘ylab topasiz. Quyidagi ikki usuldan birini tanlang.

**A) Terminal orqali (tavsiya etiladi)**

```bash
npm run create-admin
```

Login va parol so‘raladi (parol kamida 10 belgi, yozayotganda ekranda ko‘rinmaydi). Shu buyruq bilan keyinchalik **parolni almashtirish** ham mumkin: mavjud loginni kiritsangiz, uning paroli yangilanadi va barcha eski kirishlar bekor qilinadi.

**B) Brauzer orqali** (hostingda terminal bo‘lmasa)

1. Serverni ishga tushiring. Logda (terminal yoki hostingning “Logs” bo‘limi) **bir martalik kod** chiqadi.
2. `https://saytingiz/admin/setup` sahifasini oching.
3. Kodni, login va parolni kiriting.

Kod faqat birinchi administrator yaratilguncha ishlaydi, keyin o‘z-o‘zidan bekor bo‘ladi.

Shundan keyin `/admin/login` sahifasidan kirasiz.

---

## 4. Internetga joylash (hosting)

Sayt **Node.js server** va **doimiy disk** talab qiladi (ma’lumotlar bazasi va rasmlar diskda). Oddiy statik hosting (GitHub Pages, Netlify) **mos emas**.

### A) Railway (tavsiya etiladi — Visa/Mastercard kerak, Hobby tarifi oyiga $5)

1. **GitHub:** github.com da yangi **Private** repozitoriy oching → “uploading an existing file” → loyiha papkasidagi barcha fayl va papkalarni sudrab tashlang → **Commit changes**.
2. **Railway:** railway.com → GitHub bilan kiring → **New Project → Deploy from GitHub repo** → repozitoriyni tanlang. Railway `Dockerfile` ni o‘zi topadi va saytni yig‘adi.
3. **Disk (Volume):** loyiha oynasida xizmatga **Volume** qo‘shing, Mount path: **`/data`**. ⚠️ Bu qadamsiz qayta ishga tushganda mahsulotlar yo‘qoladi.
4. **Variables:** `PUBLIC_URL` = `https://goomarket.uz` (o‘z domeningiz). Qolgan sozlamalar `Dockerfile` da tayyor.
5. **Region:** Settings → Region → **EU West** (O‘zbekistonga eng yaqini).
6. **Sinov manzili:** Settings → Networking → **Generate Domain** (port **3000**). `....up.railway.app` manzili ochiladi.
7. **Birinchi admin:** **Deploy Logs** da bir martalik kod chiqadi → `sinov-manzil/admin/setup` ni oching → kod, login va parolni kiriting.
8. **Namuna:** Boshqaruv panelida “Tayyor namuna: Pods Pro 2 Premium” → narx va Uzum havolasi → **Qo‘shish** → tekshirib, **Faol** qiling.

### Domenni ulash (.uz domen + Cloudflare, bepul)

.uz registratorlari odatda asosiy domen (goomarket.uz) uchun CNAME yozuvini qo‘llamaydi, shuning uchun DNS’ni bepul Cloudflare’ga o‘tkazamiz:

1. cloudflare.com → ro‘yxatdan o‘ting → **Add a domain** → `goomarket.uz` → **Free** tarif.
2. Cloudflare 2 ta **nameserver** beradi. Domen sotib olgan saytingiz panelida (DNS / NS serverlar bo‘limi) eskilarini shu ikkitasiga almashtiring. Kuchga kirishi bir necha soatdan 1–2 kungacha.
3. Railway → Settings → Networking → **+ Custom Domain** → `goomarket.uz`, port **3000**. Railway **CNAME** va **TXT** yozuvini ko‘rsatadi.
4. Cloudflare → DNS → ikkala yozuvni aynan shunday qo‘shing: CNAME (Name `@`, **Proxied** — to‘q sariq bulut yoqilgan) va TXT.
5. `www` uchun: CNAME, Name `www`, Target `goomarket.uz`, Proxied.
6. Cloudflare → SSL/TLS → rejim **Full** (Full (Strict) emas).
7. `www.goomarket.uz` ni asosiy domenga yo‘naltirish: Rules → **Redirect Rules** → www → `https://goomarket.uz` (301).
8. Railway’da domen yonida yashil belgi chiqqach, sayt `https://goomarket.uz` da ochiladi. HTTPS sertifikati avtomatik.

### B) VPS (faqat Uzcard/Humo bo‘lsa yoki o‘z serveringiz bo‘lsa)

Ubuntu 22.04/24.04 server, Docker o‘rnatilgan bo‘lsin. Domenning A yozuvlari (`@` va `www`) server IP manziliga qaratilgan bo‘lishi kerak.

```bash
# loyiha papkasida
DOMAIN=goomarket.uz docker compose -f deploy/vps/docker-compose.yml up -d --build
docker compose -f deploy/vps/docker-compose.yml logs app   # bir martalik admin kodi shu yerda
```

HTTPS sertifikati Caddy orqali avtomatik olinadi. Ma’lumotlar `data/` papkasida saqlanadi.

⚠️ **Muhim:** `/data` (yoki `DATA_DIR`) doimiy diskda bo‘lmasa, server qayta ishga tushganda mahsulotlar va rasmlar yo‘qoladi.

**Zaxira nusxa:** Railway’da Volume → **Backups**, VPS’da `data/` papkasini muntazam nusxalang.

## 5. Xavfsizlik

- Parollar **scrypt** bilan hashlanadi. Bazada parolning o‘zi saqlanmaydi.
- Kirish 7 kunlik sessiya bilan ishlaydi. Sessiya `HttpOnly` va `SameSite=Strict` cookie’da saqlanadi, HTTPS’da `Secure` ham bo‘ladi. Bazada token o‘zi emas, faqat uning hashi saqlanadi.
- Har bir admin API’si (qo‘shish, tahrirlash, o‘chirish, rasm yuklash) **server tomonida** tekshiriladi. Kirmagan foydalanuvchi hech narsani o‘zgartira olmaydi (javob: `401`).
- Boshqa saytlardan yuborilgan so‘rovlar rad etiladi (CSRF himoyasi: maxsus sarlavha va Origin tekshiruvi).
- **Login urinishlari cheklangan:** 15 daqiqa ichida bitta login uchun 5 ta, bitta IP uchun 10 ta noto‘g‘ri urinish. Undan keyin vaqtincha bloklanadi.
- **Rasm yuklash himoyalangan:** fayl nomiga emas, ichidagi baytlarga qarab faqat haqiqiy JPG, PNG yoki WEBP qabul qilinadi. Hajm 5 MB gacha. Rasmga tasodifiy nom beriladi.
- Xavfsizlik sarlavhalari qo‘yilgan (CSP, `X-Frame-Options`, `nosniff`). Admin sahifalari qidiruv tizimlarida indekslanmaydi.
- Ishlatilmay qolgan rasmlar avtomatik tozalanadi.

---

## 6. Narxlar va chegirmalar

- Narxlar bazada **butun so‘mda** (integer) saqlanadi, shuning uchun hisob-kitobda yaxlitlash xatolari bo‘lmaydi.
- Eski narx faqat siz kiritsangiz ko‘rsatiladi va u joriy narxdan katta bo‘lishi shart.
- Chegirma foizi faqat shu ikki narxdan hisoblanadi. Hech qanday chegirma avtomatik o‘ylab topilmaydi.

---

## 7. Analitika (Instagram)

- Instagram havolalariga UTM belgilar qo‘shing, masalan:
  `https://goomarket.uz/products?utm_source=instagram&utm_campaign=kuz`
- Bu belgilar saqlanadi va Uzum Market havolasiga qo‘shib yuboriladi.
- `uzum_click` va `product_view` hodisalari `window.dataLayer` ga yoziladi.
- **Meta Pixel**: hostingda `META_PIXEL_ID` o‘zgaruvchisiga Pixel ID'ni yozing (faqat raqamlar). Kodni o‘zgartirish shart emas. Sayt quyidagi hodisalarni yuboradi:
  - `PageView` — har bir sahifa ochilganda;
  - `ViewContent` — mahsulot sahifasi ochilganda;
  - `InitiateCheckout` — "Uzum Market orqali sotib olish" bosilganda;
  - `Search` — qidiruvda;
  - `Contact` — Instagram yoki Telegram tugmasi bosilganda.

  Admin panelda Pixel ishlamaydi. Kerakli Content-Security-Policy ruxsatlari o‘zi qo‘shiladi.
- **Google Tag Manager** ulasangiz, uning domenlarini `server/http-utils.js` dagi Content-Security-Policy ro‘yxatiga qo‘shing.
- Sayt faqat Uzum’ga **o‘tishlarni** hisoblaydi. Uzum Market’dagi buyurtma va sotuvlar bu yerda kuzatilmaydi: buning uchun Uzum’ning sotuvchi kabineti hisobotlari kerak.

---

## 8. Foydali buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm start` | Saytni ishga tushirish |
| `npm run build` | Saytni qayta yig‘ish (kod o‘zgarganda) |
| `npm run create-admin` | Administrator yaratish yoki parolni almashtirish |
| `npm run import-example` (yoki admin panel → Boshqaruv paneli → “Tayyor namuna”) | **Pods Pro 2 Premium** namunasini rasmlari va landing matnlari bilan qo‘shish (narx va Uzum havolasi so‘raladi, mahsulot yashirilgan holda qo‘shiladi) |
| `npm run seed-demo` | 12 ta namunaviy mahsulot qo‘shish. Ular **yashirilgan** holda qo‘shiladi, saytda ko‘rinmaydi |
| `npm run server` + `npm run dev` | Ishlab chiqish rejimi |

---

## 9. Fayllar tuzilmasi

```
server/                  ← YANGI: backend (qo'shimcha paketlarsiz, Node.js o'zida)
  index.js               API marshrutlari, statik fayllar, mahsulot sahifasi meta-teglari
  db.js                  SQLite baza va jadvallar (migratsiyalar)
  products-repo.js       mahsulotlarni o'qish/yozish, slug tarixi
  auth.js                parollar, sessiyalar, login cheklovi, birinchi admin
  uploads.js             rasmlarni tekshirish, saqlash, tozalash
  http-utils.js          xavfsizlik sarlavhalari, CSRF, cookie
  config.js              sozlamalar (.env)
shared/
  product-schema.js      mahsulot tekshiruvi — server va admin panel uchun bitta qoidalar
  demo-products.js       namunaviy mahsulotlar
scripts/
  create-admin.js        administrator yaratish
  seed-demo.js           namunaviy mahsulotlar
src/
  admin/                 ← YANGI: admin panel (login, boshqaruv paneli, jadval, forma, rasm yuklash)
  pages/ProductPage.jsx  ← YANGI: mahsulot sahifasi
  components/ProductBits.jsx  ← YANGI: narx, chegirma, rasm, xarid tugmasi
  lib/api.js             ← YANGI: server bilan aloqa
  lib/products-store.jsx ← YANGI: saytdagi mahsulotlar manbai
  lib/router.jsx         o'zgardi: haqiqiy manzillar (/product/..., /admin/...)
  pages/Home.jsx, Catalog.jsx, components/ProductCard.jsx, SearchOverlay.jsx
                         o'zgardi: endi bazadan o'qiydi
  data/products.js       o'zgardi: faqat kategoriyalar (mahsulotlar bazada)
  i18n/translations.js   o'zgardi: mahsulot sahifasi uchun UZ/RU matnlar
  styles/product.css     ← YANGI
  preview/mockServer.js  faqat serversiz ko'rgazma versiyasi uchun
```

Eski `#/products` ko‘rinishidagi havolalar avtomatik ravishda yangi `/products` manziliga o‘tkaziladi.
