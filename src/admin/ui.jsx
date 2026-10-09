import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { PREVIEW } from '../lib/env.js';
import { Link, hrefFor } from '../lib/router.jsx';

// ---------------------------------------------------------------------
//  Bildirishnomalar ("Saqlandi", xatolar)
// ---------------------------------------------------------------------
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    // Muvaffaqiyat xabari eski xato xabarlarini olib tashlaydi
    setToasts((list) => [...(type === 'success' ? list.filter((t) => t.type !== 'error') : list).slice(-1), { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'error' ? 'warning' : 'check'} size={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ---------------------------------------------------------------------
//  Tasdiqlash oynasi (brauzerning confirm() oynasi o'rniga)
// ---------------------------------------------------------------------
export function Dialog({ open, title, children, actions, onClose, tone = 'default' }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => panelRef.current?.querySelector('[data-autofocus], button')?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`dialog dialog-${tone}`} role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" ref={panelRef}>
        <span className="dialog-icon">
          <Icon name={tone === 'danger' ? 'warning' : 'info'} size={22} />
        </span>
        <h2 id="dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
//  Forma elementlari
// ---------------------------------------------------------------------
export function Field({ id, label, hint, error, optional, children, className = '' }) {
  return (
    <div className={`a-field${error ? ' has-error' : ''} ${className}`} data-field={id}>
      <label htmlFor={id} className="a-label">
        {label}
        {optional && <span className="a-optional">ixtiyoriy</span>}
      </label>
      {children}
      {error ? (
        <p className="a-error" id={`${id}-error`} role="alert">
          <Icon name="warning" size={15} /> {error}
        </p>
      ) : (
        hint && <p className="a-hint">{hint}</p>
      )}
    </div>
  );
}

export function Toggle({ id, checked, onChange, label, description }) {
  return (
    <label className="a-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="a-switch" aria-hidden="true" />
      <span className="a-toggle-text">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </label>
  );
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

// ---------------------------------------------------------------------
//  Formatlash
// ---------------------------------------------------------------------
export const formatSum = (n) => (n == null || n === '' ? '' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
export const digitsOnly = (v) => String(v ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 10);

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const CATEGORY_LABELS = {
  earbuds: 'Quloqchinlar',
  cases: 'Telefon g‘iloflari',
  chargers: 'Zaryadlovchi qurilmalar',
  cables: 'Kabellar',
  powerbanks: 'Powerbank',
  other: 'Boshqa aksessuarlar',
};

/** Ommaviy saytdagi sahifani ochish: odatda yangi oynada, ko'rgazma rejimida shu oynada */
export function SiteLink({ to, children, ...rest }) {
  if (PREVIEW) {
    return (
      <Link to={to} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={hrefFor(to)} target="_blank" rel="noopener" {...rest}>
      {children}
    </a>
  );
}
