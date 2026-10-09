// =====================================================================
//  KATEGORIYALAR
//  Mahsulotlarning o'zi endi ma'lumotlar bazasida saqlanadi va
//  admin paneldan (/admin) boshqariladi. Bu yerda faqat kategoriyalar
//  ro'yxati va rasm bo'lmaganda ko'rsatiladigan chizma turi.
// =====================================================================
import { CATEGORY_IDS } from '../../shared/product-schema.js';

const ICONS = {
  earbuds: 'earbuds',
  cases: 'case',
  chargers: 'charger',
  cables: 'cable',
  powerbanks: 'powerbank',
  other: 'spark',
};

export const CATEGORIES = [{ id: 'all', icon: 'grid' }, ...CATEGORY_IDS.map((id) => ({ id, icon: ICONS[id] }))];

// Mahsulotda rasm bo'lmasa — kategoriyaga mos vektor chizma
export const CATEGORY_ART = {
  earbuds: { art: 'earbuds', tone: 'light' },
  cases: { art: 'case', tone: 'violet' },
  chargers: { art: 'charger', tone: 'light' },
  cables: { art: 'cable', tone: 'violet' },
  powerbanks: { art: 'powerbank', tone: 'dark' },
  other: { art: 'holder', tone: 'dark' },
};
