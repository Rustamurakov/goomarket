// =====================================================================
//  GooMarket — ASOSIY SOZLAMALAR
//  Haqiqiy ma'lumotlar tayyor bo'lganda faqat shu faylni tahrirlang.
//  `null` qiymat — ma'lumot hali kiritilmagan degani. Saytda u
//  "tez orada" holatida ko'rinadi va hech qanday soxta ma'lumot chiqmaydi.
// =====================================================================

export const SITE = {
  name: 'GooMarket',

  // Saytning to'liq manzili (SEO va ulashish uchun). Masalan: 'https://goomarket.uz'
  url: null,

  contacts: {
    instagram: 'https://www.instagram.com/goomarket.uz/',
    // Masalan: '+998 90 123 45 67' (ko'rinadigan ko'rinishi)
    phone: null,
    telegram: 'https://t.me/goomarketuz',
    // Masalan: 'info@goomarket.uz'
    email: null,
  },

  // Do'konning Uzum Market'dagi umumiy sahifasi. Masalan: 'https://uzum.uz/uz/shop/goomarket'
  uzumShopUrl: null,

  // Valyuta yorlig'i
  currency: { uz: "so'm", ru: 'сум' },
};

// ---------------------------------------------------------------------
//  ANALITIKA
//  Instagram reklamasidan kelgan UTM belgilar saqlanadi va Uzum Market
//  havolasiga qo'shib yuboriladi. Bu faqat o'tishlarni kuzatish uchun:
//  sayt Uzum Market'dagi buyurtma yoki sotuvni kuzatmaydi.
// ---------------------------------------------------------------------
export const ANALYTICS = {
  // Uzum havolalariga UTM parametrlarini qo'shish
  appendUtmToOutbound: true,
  // Agar mijoz UTM'siz kelsa, havolaga qo'yiladigan standart belgilar
  defaultOutboundUtm: {
    utm_source: 'goomarket',
    utm_medium: 'website',
  },
  // Google Tag Manager / GA4 / Meta Pixel ulanganda hodisalar shu nom bilan yuboriladi
  outboundEventName: 'uzum_click',
};
