import { DatabaseSync } from 'node:sqlite';
import { paths } from './config.js';

// SQLite — bitta fayldan iborat ishonchli ma'lumotlar bazasi (data/goomarket.db).
// Node.js 22 ichiga o'rnatilgan, alohida server yoki parol talab qilmaydi.
export const db = new DatabaseSync(paths.db);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

const MIGRATIONS = [
  // 1-versiya: asosiy jadvallar
  `
  CREATE TABLE products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name_uz     TEXT    NOT NULL,
    name_ru     TEXT    NOT NULL,
    price       INTEGER NOT NULL CHECK (price >= 0),          -- so'mda, butun son
    old_price   INTEGER          CHECK (old_price IS NULL OR old_price > price),
    main_image  TEXT,
    gallery     TEXT    NOT NULL DEFAULT '[]',                -- JSON massiv
    desc_uz     TEXT    NOT NULL DEFAULT '',
    desc_ru     TEXT    NOT NULL DEFAULT '',
    category    TEXT    NOT NULL,
    features    TEXT    NOT NULL DEFAULT '[]',                -- JSON: [{uz, ru}]
    uzum_url    TEXT,
    status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
    featured    INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
  );
  CREATE INDEX idx_products_status ON products (status);
  CREATE INDEX idx_products_category ON products (category);

  -- Mahsulot manzili (slug) o'zgarganda eski havolalar yangisiga yo'naltiriladi
  CREATE TABLE product_slugs (
    slug       TEXT PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE
  );

  CREATE TABLE admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,                               -- token o'zi emas, faqat SHA-256 hashi
    admin_id   INTEGER NOT NULL REFERENCES admins (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  `,
  // 2-versiya: landing sahifa maydonlari (shior, Uzum statistikasi, video, bo'limlar)
  `
  ALTER TABLE products ADD COLUMN tagline_uz   TEXT    NOT NULL DEFAULT '';
  ALTER TABLE products ADD COLUMN tagline_ru   TEXT    NOT NULL DEFAULT '';
  ALTER TABLE products ADD COLUMN sold_count   INTEGER CHECK (sold_count IS NULL OR sold_count >= 0);
  ALTER TABLE products ADD COLUMN review_count INTEGER CHECK (review_count IS NULL OR review_count >= 0);
  ALTER TABLE products ADD COLUMN rating       INTEGER CHECK (rating IS NULL OR rating BETWEEN 10 AND 50); -- 48 = 4.8
  ALTER TABLE products ADD COLUMN video_url    TEXT;
  ALTER TABLE products ADD COLUMN video_poster TEXT;
  ALTER TABLE products ADD COLUMN sections     TEXT    NOT NULL DEFAULT '[]';                         -- JSON
  `,
  // 3-versiya: "arzon analog va premium" taqqoslash bloki (JSON, bo'sh bo'lsa NULL)
  `
  ALTER TABLE products ADD COLUMN comparison TEXT;
  `,
];

function migrate() {
  const { user_version: current } = db.prepare('PRAGMA user_version').get();
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
migrate();

export function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export const nowIso = () => new Date().toISOString();
