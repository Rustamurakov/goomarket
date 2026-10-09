import { Link } from '../lib/router.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { Icon } from './Icons.jsx';

export function SectionHead({ eyebrow, title, link, linkTo, as: Tag = 'h2', children }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className="section-title">{title}</Tag>
        {children}
      </div>
      {link && (
        <Link to={linkTo} className="text-link">
          {link} <Icon name="arrow" size={18} />
        </Link>
      )}
    </div>
  );
}

export function ValueGrid({ items }) {
  return (
    <ul className={`value-grid cols-${items.length}`}>
      {items.map((v) => (
        <li key={v.t} className="value-card">
          <span className="value-icon">
            <Icon name={v.icon} size={22} />
          </span>
          <h3>{v.t}</h3>
          <p>{v.d}</p>
        </li>
      ))}
    </ul>
  );
}

export function CtaBanner({ title, text, button, to }) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-banner">
          <div className="cta-copy">
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <Link to={to} className="btn btn-light btn-lg">
            {button} <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, lead, children }) {
  return (
    <section className="page-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {lead && <p className="page-lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

/** Server bilan aloqa bo'lmaganda yoki mahsulotlar hali yo'q bo'lganda */
export function StatusBlock({ icon = 'info', title, text, action, onAction }) {
  return (
    <div className="empty-state">
      <span className="value-icon">
        <Icon name={icon} size={24} />
      </span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action && (
        <button type="button" className="btn btn-ghost" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
