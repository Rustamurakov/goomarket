import { useCallback, useEffect, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { LANGS } from '../i18n/translations.js';
import { Link, ROUTES } from '../lib/router.jsx';
import { Icon } from './Icons.jsx';
import { Logo } from './Logo.jsx';
import { SearchOverlay } from './SearchOverlay.jsx';

export const NAV = [
  { key: 'home', to: ROUTES.home },
  { key: 'products', to: ROUTES.products },
  { key: 'about', to: ROUTES.about },
  { key: 'contact', to: ROUTES.contact },
];

export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label={t.nav.lang}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'is-active' : ''}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
          lang={l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Header({ currentPath }) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [currentPath]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.classList.add('no-scroll');
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}>
        <div className="container header-inner">
          <Logo />

          <nav className="main-nav" aria-label={t.nav.menu}>
            {NAV.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className={`nav-link${currentPath === item.to ? ' is-active' : ''}`}
                aria-current={currentPath === item.to ? 'page' : undefined}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={t.nav.search}>
              <Icon name="search" />
            </button>
            <LangSwitch />
            <button
              type="button"
              className="icon-btn menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.nav.close : t.nav.menu}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} hidden={!menuOpen}>
          <nav className="container" aria-label={t.nav.menu}>
            {NAV.map((item, i) => (
              <Link
                key={item.key}
                to={item.to}
                className={`mobile-link${currentPath === item.to ? ' is-active' : ''}`}
                aria-current={currentPath === item.to ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                style={{ '--i': i }}
              >
                <span className="mobile-num">0{i + 1}</span>
                {t.nav[item.key]}
                <Icon name="arrow" size={20} />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
