/* global __PREVIEW__ */
// Ko'rgazma rejimi: serversiz yig'ilgan versiya (faqat ko'rib chiqish uchun).
// Oddiy "npm run build" da bu har doim false.
export const PREVIEW = typeof __PREVIEW__ !== 'undefined' && __PREVIEW__ === true;
