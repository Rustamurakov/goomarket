import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { Link, ROUTES, replaceQuietly } from '../lib/router.jsx';
import { invalidateProducts } from '../lib/products-store.jsx';
import { searchProducts } from '../lib/search.js';
import { CATEGORY_IDS } from '../../shared/product-schema.js';
import { Icon } from '../components/Icons.jsx';
import { ProductImage } from '../components/ProductBits.jsx';
import { CATEGORY_LABELS, Dialog, SiteLink, Spinner, digitsOnly, formatDate, formatSum, useToast } from './ui.jsx';

/** Jadvalning o'zida narxni tez o'zgartirish */
function PriceCell({ product, onSaved, onUnauthorized }) {
  const toast = useToast();
  const [value, setValue] = useState(String(product.price));
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [error, setError] = useState('');
  useEffect(() => setValue(String(product.price)), [product.price]);
  const dirty = value !== String(product.price);

  const save = async () => {
    if (!dirty || state === 'saving') return;
    if (!value) {
      setError('Narxni kiriting');
      setState('error');
      return;
    }
    setState('saving');
    setError('');
    try {
      const { product: updated } = await api(`/api/admin/products/${product.id}`, { method: 'PATCH', body: { price: value } });
      onSaved(updated);
      setState('saved');
      toast(`Narx saqlandi: ${formatSum(updated.price)} so‘m — saytda yangilandi`);
      setTimeout(() => setState((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError(err.fields?.oldPrice || err.fields?.price || err.message);
      setState('error');
    }
  };

  return (
    <div className={`a-price-cell is-${state}`}>
      <div className="a-price-input">
        <input
          id={`price-${product.id}`}
          className="a-input"
          inputMode="numeric"
          value={formatSum(value)}
          aria-label={`${product.name.uz} narxi, so‘m`}
          onChange={(e) => {
            setValue(digitsOnly(e.target.value));
            setState('idle');
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
              setValue(String(product.price));
              setState('idle');
              setError('');
            }
          }}
        />
        <span className="a-suffix">so‘m</span>
      </div>
      {dirty && state !== 'saving' && (
        <button type="button" className="a-mini-btn" onClick={save}>
          <Icon name="check" size={16} /> Saqlash
        </button>
      )}
      {state === 'saving' && <Spinner size={16} />}
      {state === 'saved' && (
        <span className="a-saved">
          <Icon name="check" size={16} /> Saqlandi
        </span>
      )}
      {product.oldPrice && !error && <small className="a-old">eski: {formatSum(product.oldPrice)}</small>}
      {error && <small className="a-cell-error">{error}</small>}
    </div>
  );
}

export default function ProductList({ query, onUnauthorized }) {
  const toast = useToast();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState(query.get('q') || '');
  const [category, setCategory] = useState(query.get('cat') || 'all');
  const [status, setStatus] = useState(query.get('status') || 'all');
  const [pending, setPending] = useState(null); // o'chirish oynasi uchun mahsulot
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setError('');
    api('/api/admin/products')
      .then((d) => setProducts(d.products))
      .catch((err) => (err.status === 401 ? onUnauthorized() : setError(err.message)));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (category !== 'all') p.set('cat', category);
    if (status !== 'all') p.set('status', status);
    replaceQuietly(`${ROUTES.adminProducts}${p.toString() ? `?${p}` : ''}`);
  }, [q, category, status]);

  const list = useMemo(() => {
    if (!products) return [];
    let items = searchProducts(products, q);
    if (category !== 'all') items = items.filter((p) => p.category === category);
    if (status === 'active' || status === 'hidden') items = items.filter((p) => p.status === status);
    if (status === 'nouzum') items = items.filter((p) => !p.uzumUrl);
    return items;
  }, [products, q, category, status]);

  const replace = (updated) => {
    setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    invalidateProducts();
  };

  const toggleStatus = async (product) => {
    const next = product.status === 'active' ? 'hidden' : 'active';
    setBusyId(product.id);
    try {
      const { product: updated } = await api(`/api/admin/products/${product.id}`, { method: 'PATCH', body: { status: next } });
      replace(updated);
      toast(next === 'hidden' ? `"${product.name.uz}" yashirildi — saytda ko‘rinmaydi` : `"${product.name.uz}" saytda qayta ko‘rinadi`);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const hideFromDialog = async () => {
    const p = pending;
    setPending(null);
    if (p.status === 'active') await toggleStatus(p);
  };

  const remove = async () => {
    const p = pending;
    setPending(null);
    setBusyId(p.id);
    try {
      await api(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      setProducts((list) => list.filter((x) => x.id !== p.id));
      invalidateProducts();
      toast(`"${p.name.uz}" butunlay o‘chirildi`);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filtersActive = q || category !== 'all' || status !== 'all';

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <h1 className="a-title">Mahsulotlar</h1>
          <p className="a-sub">{products ? `${products.length} ta mahsulot` : 'Yuklanmoqda…'}</p>
        </div>
        <Link to={ROUTES.adminNew} className="btn btn-primary">
          <Icon name="plus" size={18} /> Yangi mahsulot
        </Link>
      </header>

      <div className="a-filters">
        <label className="a-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Nomi bo‘yicha qidirish</span>
          <input id="admin-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nomi bo‘yicha qidirish…" />
        </label>
        <select id="admin-category" className="a-input a-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kategoriya">
          <option value="all">Barcha kategoriyalar</option>
          {CATEGORY_IDS.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select id="admin-status" className="a-input a-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Holati">
          <option value="all">Barcha holatlar</option>
          <option value="active">Faol</option>
          <option value="hidden">Yashirilgan</option>
          <option value="nouzum">Uzum havolasi yo‘q</option>
        </select>
      </div>

      {error && (
        <div className="a-callout a-callout-warn">
          <Icon name="warning" size={18} />
          <span>{error}</span>
          <button type="button" className="a-mini-btn" onClick={load}>
            Qayta urinish
          </button>
        </div>
      )}

      {!products && !error && (
        <div className="a-center">
          <Spinner size={28} />
        </div>
      )}

      {products && products.length === 0 && (
        <div className="a-card a-empty">
          <Icon name="bag" size={28} />
          <p>Hali mahsulot yo‘q. Birinchi mahsulotni qo‘shing.</p>
          <Link to={ROUTES.adminNew} className="btn btn-primary">
            <Icon name="plus" size={18} /> Mahsulot qo‘shish
          </Link>
        </div>
      )}

      {products && products.length > 0 && list.length === 0 && (
        <div className="a-card a-empty">
          <Icon name="search" size={28} />
          <p>Filtrga mos mahsulot topilmadi.</p>
          {filtersActive && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQ('');
                setCategory('all');
                setStatus('all');
              }}
            >
              Filtrni tozalash
            </button>
          )}
        </div>
      )}

      {list.length > 0 && (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th scope="col">Rasm</th>
                <th scope="col">Nomi</th>
                <th scope="col">Narxi</th>
                <th scope="col">Kategoriya</th>
                <th scope="col">Holati</th>
                <th scope="col">Yangilangan</th>
                <th scope="col">
                  <span className="sr-only">Amallar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={p.status === 'hidden' ? 'is-hidden-row' : ''} aria-busy={busyId === p.id}>
                  <td className="c-thumb">
                    <Link to={ROUTES.adminEdit(p.id)} className="a-thumb" tabIndex={-1} aria-hidden="true">
                      <ProductImage product={p} alt="" />
                    </Link>
                  </td>
                  <td className="c-name">
                    <Link to={ROUTES.adminEdit(p.id)} className="a-name-link">
                      {p.name.uz}
                    </Link>
                    <small>{p.name.ru}</small>
                    {!p.uzumUrl && (
                      <span className="a-warn-chip" title="Saytda xarid tugmasi ko‘rinmaydi">
                        <Icon name="warning" size={14} /> Uzum havolasi yo‘q
                      </span>
                    )}
                    {p.featured && p.status === 'active' && (
                      <span className="a-feat-chip">
                        <Icon name="star" size={13} /> Bosh sahifada
                      </span>
                    )}
                  </td>
                  <td className="c-price" data-label="Narxi">
                    <PriceCell product={p} onSaved={replace} onUnauthorized={onUnauthorized} />
                  </td>
                  <td className="c-cat" data-label="Kategoriya">
                    {CATEGORY_LABELS[p.category]}
                  </td>
                  <td className="c-status" data-label="Holati">
                    <span className={`a-badge ${p.status === 'active' ? 'is-active' : 'is-hidden'}`}>
                      {p.status === 'active' ? 'Faol' : 'Yashirilgan'}
                    </span>
                  </td>
                  <td className="c-date" data-label="Yangilangan">
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="c-actions">
                    <div className="a-actions">
                      <Link to={ROUTES.adminEdit(p.id)} className="a-act" title="Tahrirlash">
                        <Icon name="edit" size={18} />
                        <span>Tahrirlash</span>
                      </Link>
                      <button
                        type="button"
                        className="a-act"
                        onClick={() => toggleStatus(p)}
                        disabled={busyId === p.id}
                        title={p.status === 'active' ? 'Yashirish — saytdan olib qo‘yish' : 'Saytda qayta ko‘rsatish'}
                      >
                        <Icon name={p.status === 'active' ? 'eyeOff' : 'eye'} size={18} />
                        <span>{p.status === 'active' ? 'Yashirish' : 'Ko‘rsatish'}</span>
                      </button>
                      {p.status === 'active' && (
                        <SiteLink className="a-act" to={ROUTES.product(p.slug)} title="Saytda ochish">
                          <Icon name="external" size={18} />
                          <span>Saytda</span>
                        </SiteLink>
                      )}
                      <button type="button" className="a-act a-act-danger" onClick={() => setPending(p)} disabled={busyId === p.id} title="O‘chirish">
                        <Icon name="trash" size={18} />
                        <span>O‘chirish</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteDialog product={pending} onClose={() => setPending(null)} onHide={hideFromDialog} onDelete={remove} />
    </div>
  );
}

export function DeleteDialog({ product, onClose, onHide, onDelete }) {
  const [typed, setTyped] = useState(false);
  useEffect(() => setTyped(false), [product]);
  return (
    <Dialog
      open={Boolean(product)}
      tone="danger"
      title="Mahsulotni o‘chirasizmi?"
      onClose={onClose}
      actions={
        <>
          {product?.status === 'active' && (
            <button type="button" className="btn btn-primary" onClick={onHide} data-autofocus>
              <Icon name="eyeOff" size={18} /> Yashirish (tavsiya etiladi)
            </button>
          )}
          <button type="button" className="btn btn-danger" onClick={onDelete} disabled={!typed}>
            <Icon name="trash" size={18} /> Butunlay o‘chirish
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} data-autofocus={product?.status !== 'active' || undefined}>
            Bekor qilish
          </button>
        </>
      }
    >
      {product && (
        <>
          <p>
            <b>{product.name.uz}</b> va uning rasmlari butunlay o‘chiriladi. Buni qaytarib bo‘lmaydi.
          </p>
          <p className="a-dialog-tip">
            <Icon name="eyeOff" size={16} />
            <span>
              Agar mahsulot vaqtincha yo‘q bo‘lsa, <b>yashiring</b>: u saytdan olinadi, lekin barcha ma’lumotlari saqlanib qoladi va bir
              bosishda qayta chiqarish mumkin.
            </span>
          </p>
          <label className="a-check">
            <input id="confirm-delete" type="checkbox" checked={typed} onChange={(e) => setTyped(e.target.checked)} />
            <span>Ha, bu mahsulotni butunlay o‘chirmoqchiman</span>
          </label>
        </>
      )}
    </Dialog>
  );
}
