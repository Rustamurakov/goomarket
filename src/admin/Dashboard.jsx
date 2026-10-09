import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Link, ROUTES } from '../lib/router.jsx';
import { Icon } from '../components/Icons.jsx';
import { ProductImage } from '../components/ProductBits.jsx';
import { CATEGORY_LABELS, Spinner, formatDate, formatSum } from './ui.jsx';
import ExampleImport from './ExampleImport.jsx';

export default function Dashboard({ onUnauthorized }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api('/api/admin/stats')
      .then(setData)
      .catch((err) => (err.status === 401 ? onUnauthorized() : setError(err.message)));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  if (error) {
    return (
      <div className="a-page">
        <p className="a-form-error">{error}</p>
        <button type="button" className="btn btn-ghost" onClick={load}>
          Qayta urinish
        </button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="a-center">
        <Spinner size={28} />
      </div>
    );
  }

  const tiles = [
    { label: 'Jami mahsulotlar', value: data.total, icon: 'list', to: ROUTES.adminProducts },
    { label: 'Faol — saytda ko‘rinadi', value: data.active, icon: 'eye', to: `${ROUTES.adminProducts}?status=active`, tone: 'ok' },
    { label: 'Yashirilgan', value: data.hidden, icon: 'eyeOff', to: `${ROUTES.adminProducts}?status=hidden`, tone: 'muted' },
  ];

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <h1 className="a-title">Boshqaruv paneli</h1>
          <p className="a-sub">Do‘koningiz holati bir qarashda.</p>
        </div>
        <Link to={ROUTES.adminNew} className="btn btn-primary">
          <Icon name="plus" size={18} /> Yangi mahsulot
        </Link>
      </header>

      <div className="a-stats">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className={`a-stat${t.tone ? ` tone-${t.tone}` : ''}`}>
            <span className="a-stat-icon">
              <Icon name={t.icon} size={20} />
            </span>
            <strong>{t.value}</strong>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>

      {data.missingUzum > 0 && (
        <Link to={`${ROUTES.adminProducts}?status=nouzum`} className="a-callout a-callout-warn a-callout-link">
          <Icon name="warning" size={20} />
          <span>
            <b>{data.missingUzum} ta faol mahsulotda Uzum Market havolasi yo‘q.</b> Ularda saytda xarid tugmasi ko‘rinmaydi.
            Havolani qo‘shish uchun bosing.
          </span>
          <Icon name="arrow" size={18} />
        </Link>
      )}

      <ExampleImport />

      <section className="a-card">
        <div className="a-card-head">
          <h2>Oxirgi qo‘shilgan mahsulotlar</h2>
          <Link to={ROUTES.adminProducts} className="text-link">
            Hammasi <Icon name="arrow" size={16} />
          </Link>
        </div>
        {data.recent.length ? (
          <ul className="a-recent">
            {data.recent.map((p) => (
              <li key={p.id}>
                <Link to={ROUTES.adminEdit(p.id)} className="a-recent-row">
                  <span className="a-thumb">
                    <ProductImage product={p} alt="" />
                  </span>
                  <span className="a-recent-name">
                    <strong>{p.name.uz}</strong>
                    <small>
                      {CATEGORY_LABELS[p.category]} · {formatDate(p.createdAt)}
                    </small>
                  </span>
                  <span className="a-recent-price">{formatSum(p.price)} so‘m</span>
                  <span className={`a-badge ${p.status === 'active' ? 'is-active' : 'is-hidden'}`}>
                    {p.status === 'active' ? 'Faol' : 'Yashirilgan'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="a-empty">
            <Icon name="bag" size={28} />
            <p>Hali mahsulot yo‘q. Birinchi mahsulotingizni qo‘shing — u darhol saytda paydo bo‘ladi.</p>
            <Link to={ROUTES.adminNew} className="btn btn-primary">
              <Icon name="plus" size={18} /> Mahsulot qo‘shish
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
