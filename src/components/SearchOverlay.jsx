import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useProducts } from '../lib/products-store.jsx';
import { searchProducts } from '../lib/search.js';
import { navigate, ROUTES } from '../lib/router.jsx';
import { trackEvent } from '../lib/analytics.js';
import { Icon } from './Icons.jsx';
import { ProductImage } from './ProductBits.jsx';

export function SearchOverlay({ open, onClose }) {
  const { lang, t } = useLang();
  const { products } = useProducts();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => (query.trim() ? searchProducts(products, query).slice(0, 6) : []), [query, products]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open, onClose]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (product) => {
    trackEvent('search_select', { product_id: product.id, query });
    onClose();
    navigate(ROUTES.product(product.slug));
  };

  const goAll = () => {
    if (query.trim()) trackEvent('search_submit', { query });
    onClose();
    navigate(query.trim() ? `${ROUTES.products}?q=${encodeURIComponent(query.trim())}` : ROUTES.products);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) go(results[active]);
      else goAll();
    }
  };

  return (
    <div className="search-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-panel" role="dialog" aria-modal="true" aria-label={t.search.title}>
        <div className="search-field">
          <Icon name="search" size={22} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            aria-label={t.search.title}
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t.nav.close}>
            <Icon name="close" />
          </button>
        </div>

        <div className="search-body">
          {!query.trim() && (
            <div className="search-empty">
              <p className="muted">{t.search.hint}</p>
              <p className="search-label">{t.search.popular}</p>
              <div className="chip-row">
                {['earbuds', 'cases', 'chargers', 'cables', 'powerbanks'].map((c) => (
                  <button key={c} type="button" className="chip" onClick={() => setQuery(t.categories[c].split(' ')[0])}>
                    {t.categories[c]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && results.length === 0 && <p className="search-none">{t.search.none}</p>}

          {results.length > 0 && (
            <ul id="search-results" className="search-results" role="listbox">
              {results.map((p, i) => (
                <li key={p.id} id={`sr-${p.id}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={`search-item${i === active ? ' is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(p)}
                  >
                    <span className="search-thumb">
                      <ProductImage product={p} alt="" />
                    </span>
                    <span className="search-text">
                      <strong>{p.name[lang]}</strong>
                      <small>{t.categories[p.category]}</small>
                    </span>
                    <Icon name="arrow" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && (
            <button type="button" className="search-all" onClick={goAll}>
              {t.search.all} <Icon name="arrow" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
