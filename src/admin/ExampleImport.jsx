import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { navigate, ROUTES } from '../lib/router.jsx';
import { invalidateProducts } from '../lib/products-store.jsx';
import { Icon } from '../components/Icons.jsx';
import { Field, Spinner, digitsOnly, formatSum, useToast } from './ui.jsx';

// Tayyor namunani (Pods Pro 2 Premium) bir bosishda qo'shish — terminal kerak emas
export default function ExampleImport() {
  const toast = useToast();
  const [examples, setExamples] = useState([]);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ price: '', oldPrice: '', uzumUrl: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/admin/examples')
      .then((d) => setExamples((d.examples || []).filter((e) => !e.imported)))
      .catch(() => {});
  }, []);

  if (!examples.length) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.price) {
      setErrors({ price: 'Narxni kiriting' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const { product } = await api(`/api/admin/examples/${open}/import`, { method: 'POST', body: form });
      invalidateProducts();
      toast(`"${product.name.uz}" qo‘shildi. Tekshirib, “Faol” qiling`);
      navigate(ROUTES.adminEdit(product.id));
    } catch (err) {
      setErrors(err.fields || {});
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="a-card a-example">
      {examples.map((ex) => (
        <div key={ex.id} className="a-example-row">
          <img src={`/api/admin/examples/${ex.id}/image/${ex.image}`} alt="" className="a-example-img" />
          <div className="a-example-text">
            <strong>Tayyor namuna: {ex.name}</strong>
            <span>Rasmlar, landing matnlari, video bo‘limi va taqqoslash bilan. Faqat narx va Uzum havolasini kiriting.</span>
          </div>
          {open !== ex.id && (
            <button type="button" className="btn btn-primary" onClick={() => setOpen(ex.id)}>
              <Icon name="plus" size={18} /> Qo‘shish
            </button>
          )}
        </div>
      ))}
      {open && (
        <form className="a-form a-example-form" onSubmit={submit} noValidate>
          <div className="a-grid-2">
            <Field id="ex-price" label="Narxi" error={errors.price}>
              <div className="a-input-wrap">
                <input id="ex-price" className="a-input a-num has-suffix" inputMode="numeric" placeholder="249 000" value={formatSum(form.price)} onChange={(e) => setForm({ ...form, price: digitsOnly(e.target.value) })} />
                <span className="a-suffix">so‘m</span>
              </div>
            </Field>
            <Field id="ex-old" label="Eski narxi" optional error={errors.oldPrice}>
              <div className="a-input-wrap">
                <input id="ex-old" className="a-input a-num has-suffix" inputMode="numeric" placeholder="—" value={formatSum(form.oldPrice)} onChange={(e) => setForm({ ...form, oldPrice: digitsOnly(e.target.value) })} />
                <span className="a-suffix">so‘m</span>
              </div>
            </Field>
          </div>
          <Field id="ex-uzum" label="Uzum Market havolasi" optional error={errors.uzumUrl} hint="Mahsulotning Uzum Market’dagi sahifasidan nusxa oling">
            <input id="ex-uzum" className="a-input" type="url" inputMode="url" placeholder="https://uzum.uz/uz/product/..." value={form.uzumUrl} onChange={(e) => setForm({ ...form, uzumUrl: e.target.value })} />
          </Field>
          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <Spinner /> : <Icon name="check" size={18} />} Namunani qo‘shish
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(null)}>
              Bekor qilish
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
