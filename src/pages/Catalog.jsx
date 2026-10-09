import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useSeo } from '../lib/useSeo.js';
import { ROUTES, replaceQuietly } from '../lib/router.jsx';
import { CATEGORIES } from '../data/products.js';
import { useProducts } from '../lib/products-store.jsx';
import { searchProducts } from '../lib/search.js';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard.jsx';
import { Icon } from '../components/Icons.jsx';
import { PageHero, StatusBlock } from '../components/Blocks.jsx';

const VALID_CATS = CATEGORIES.map((c) => c.id);

export default function Catalog({ query }) {
  const { lang, t } = useLang();
  useSeo({ ...t.seo.products, lang });
  const { products, status, reload } = useProducts();

  const qsKey = query.toString();
  const [search, setSearch] = useState(query.get('q') || '');
  const [category, setCategory] = useState(VALID_CATS.includes(query.get('cat')) ? query.get('cat') : 'all');
  const [sort, setSort] = useState('default');

  // Havola parametrlari o'zgarganda (qidiruvdan yoki kategoriyadan kelinganda) filtrlarni yangilash
  useEffect(() => {
    const cat = query.get('cat');
    setSearch(query.get('q') || '');
    setCategory(VALID_CATS.includes(cat) ? cat : 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsKey]);

  // Filtr holatini manzil satrida saqlash (ulashish uchun), sahifani qayta yuklamasdan
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('cat', category);
    if (search.trim()) params.set('q', search.trim());
    replaceQuietly(`${ROUTES.products}${params.toString() ? `?${params}` : ''}`);
  }, [category, search]);

  const counts = useMemo(() => {
    const base = searchProducts(products, search);
    const out = { all: base.length };
    base.forEach((p) => (out[p.category] = (out[p.category] || 0) + 1));
    return out;
  }, [search, products]);

  const list = useMemo(() => {
    let items = searchProducts(products, search);
    if (category !== 'all') items = items.filter((p) => p.category === category);
    if (sort === 'asc') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'desc') items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [search, category, sort, products]);

  const reset = () => {
    setSearch('');
    setCategory('all');
    setSort('default');
  };

  let content;
  if (status === 'loading') {
    content = (
      <div className="product-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (status === 'error') {
    content = <StatusBlock icon="info" title={t.catalog.loadError} action={t.catalog.retry} onAction={() => reload()} />;
  } else if (!products.length) {
    content = <StatusBlock icon="bag" title={t.catalog.storeEmpty} text={t.catalog.storeEmptyHint} />;
  } else if (!list.length) {
    content = <StatusBlock icon="search" title={t.catalog.empty} text={t.catalog.emptyHint} action={t.catalog.reset} onAction={reset} />;
  } else {
    content = (
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHero eyebrow={t.catalog.eyebrow} title={t.catalog.title} lead={t.catalog.lead} />

      <section className="section section-tight">
        <div className="container">
          <div className="catalog-toolbar">
            <label className="field field-search">
              <Icon name="search" size={20} />
              <span className="sr-only">{t.nav.search}</span>
              <input
                id="catalog-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.catalog.searchPlaceholder}
                autoComplete="off"
                enterKeyHint="search"
              />
            </label>
            <label className="field field-select">
              <span className="field-label">{t.catalog.sortLabel}</span>
              <select id="catalog-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">{t.catalog.sort.default}</option>
                <option value="asc">{t.catalog.sort.asc}</option>
                <option value="desc">{t.catalog.sort.desc}</option>
              </select>
              <Icon name="chevron" size={18} />
            </label>
          </div>

          <div className="filter-row" role="group" aria-label={t.catalog.eyebrow}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`filter-chip${category === c.id ? ' is-active' : ''}`}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                <Icon name={c.icon} size={17} />
                {t.categories[c.id]}
                <span className="filter-count">{counts[c.id] || 0}</span>
              </button>
            ))}
          </div>

          {status === 'ready' && (
            <p className="result-count" aria-live="polite">
              {t.catalog.count(list.length)}
            </p>
          )}

          {content}
        </div>
      </section>
    </>
  );
}
