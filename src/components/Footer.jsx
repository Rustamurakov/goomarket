import { useLang } from '../i18n/LanguageContext.jsx';
import { SITE } from '../config/site.js';
import { Link } from '../lib/router.jsx';
import { NAV } from './Header.jsx';
import { Logo } from './Logo.jsx';
import { Icon } from './Icons.jsx';

export function Footer() {
  const { t } = useLang();
  const { instagram, telegram } = SITE.contacts;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>{t.footer.text}</p>
        </div>
        <div>
          <p className="footer-title">{t.footer.pages}</p>
          <ul className="footer-links">
            {NAV.map((n) => (
              <li key={n.key}>
                <Link to={n.to}>{t.nav[n.key]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="footer-title">{t.footer.contact}</p>
          <div className="footer-social">
            {instagram ? (
              <a className="icon-btn" href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Icon name="instagram" />
              </a>
            ) : (
              <span className="icon-btn is-disabled" title={t.contact.soon} aria-label={`Instagram — ${t.contact.soon}`}>
                <Icon name="instagram" />
              </span>
            )}
            {telegram ? (
              <a className="icon-btn" href={telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <Icon name="telegram" />
              </a>
            ) : (
              <span className="icon-btn is-disabled" title={t.contact.soon} aria-label={`Telegram — ${t.contact.soon}`}>
                <Icon name="telegram" />
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>
          © {year} {SITE.name}. {t.footer.rights}
        </p>
        <p className="muted">{t.footer.note}</p>
      </div>
    </footer>
  );
}
