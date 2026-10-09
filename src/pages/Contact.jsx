import { useLang } from '../i18n/LanguageContext.jsx';
import { useSeo } from '../lib/useSeo.js';
import { Link, ROUTES } from '../lib/router.jsx';
import { SITE } from '../config/site.js';
import { trackEvent } from '../lib/analytics.js';
import { Icon } from '../components/Icons.jsx';
import { PageHero } from '../components/Blocks.jsx';

/** https://t.me/goomarketuz → @goomarketuz */
function handleOf(url) {
  try {
    const name = new URL(url).pathname.split('/').filter(Boolean)[0];
    return name ? `@${name}` : null;
  } catch {
    return null;
  }
}

function ContactCard({ icon, title, text, value, href, cta, external, featured, soon }) {
  const content = (
    <>
      <span className="contact-icon">
        <Icon name={icon} size={24} />
      </span>
      <span className="contact-text">
        <strong>{title}</strong>
        <small>{text}</small>
        <span className={`contact-value${href ? '' : ' is-empty'}`}>{href ? value || cta : soon}</span>
      </span>
      {href && <Icon name={external ? 'external' : 'arrow'} size={20} className="contact-go" />}
    </>
  );

  if (!href) {
    return (
      <div className={`contact-card is-disabled${featured ? ' is-featured' : ''}`} aria-disabled="true">
        {content}
      </div>
    );
  }
  return (
    <a
      className={`contact-card${featured ? ' is-featured' : ''}`}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={() => trackEvent('contact_click', { channel: icon })}
    >
      {content}
    </a>
  );
}

export default function Contact() {
  const { lang, t } = useLang();
  useSeo({ ...t.seo.contact, lang });
  const c = t.contact;
  const { instagram, telegram, phone, email } = SITE.contacts;

  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} lead={c.lead} />

      <section className="section section-tight">
        <div className="container contact-grid">
          <ContactCard
            featured
            icon="instagram"
            title={c.instagram}
            text={c.instagramText}
            href={instagram}
            value={handleOf(instagram)}
            cta={c.instagramCta}
            external
            soon={c.soon}
          />
          <ContactCard icon="telegram" title={c.telegram} text={c.telegramText} href={telegram} value={handleOf(telegram)} cta={c.telegramCta} external soon={c.soon} />
          <ContactCard
            icon="phone"
            title={c.phone}
            text={c.phoneText}
            value={phone}
            href={phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null}
            soon={c.soon}
          />
          <ContactCard icon="mail" title={c.email} text={c.emailText} value={email} href={email ? `mailto:${email}` : null} soon={c.soon} />
        </div>

        <div className="container">
          <div className="order-note">
            <Icon name="bag" size={22} />
            <p>{c.orderNote}</p>
            <Link to={ROUTES.products} className="btn btn-primary">
              {c.orderCta} <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
