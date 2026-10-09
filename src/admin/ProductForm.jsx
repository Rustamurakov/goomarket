import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { Link, ROUTES, navigate, setLeaveGuard } from '../lib/router.jsx';
import { invalidateProducts } from '../lib/products-store.jsx';
import { CATEGORY_IDS, LIMITS, discountPercent, isUzumUrl, slugify, validateProduct } from '../../shared/product-schema.js';
import { Icon } from '../components/Icons.jsx';
import { ImageField } from './ImageField.jsx';
import { ComparisonEditor, EMPTY_COMPARISON, SectionsEditor, StatsFields, TaglineFields, VideoField } from './LandingFields.jsx';
import { DeleteDialog } from './ProductList.jsx';
import { CATEGORY_LABELS, Dialog, Field, SiteLink, Spinner, Toggle, digitsOnly, formatDate, formatSum, useToast } from './ui.jsx';

const EMPTY = {
  nameUz: '',
  nameRu: '',
  slug: '',
  price: '',
  oldPrice: '',
  mainImage: null,
  gallery: [],
  descUz: '',
  descRu: '',
  category: '',
  features: [],
  uzumUrl: '',
  status: 'active',
  featured: false,
  taglineUz: '',
  taglineRu: '',
  soldCount: '',
  reviewCount: '',
  rating: '',
  videoUrl: '',
  videoPoster: null,
  sections: [],
  comparison: null,
};

function fromProduct(p) {
  return {
    nameUz: p.name.uz,
    nameRu: p.name.ru,
    slug: p.slug,
    price: String(p.price),
    oldPrice: p.oldPrice ? String(p.oldPrice) : '',
    mainImage: p.image,
    gallery: p.gallery || [],
    descUz: p.desc.uz || '',
    descRu: p.desc.ru || '',
    category: p.category,
    features: (p.features || []).map((f) => ({ uz: f.uz || '', ru: f.ru || '' })),
    uzumUrl: p.uzumUrl || '',
    status: p.status,
    featured: p.featured,
    taglineUz: p.tagline?.uz || '',
    taglineRu: p.tagline?.ru || '',
    soldCount: p.soldCount != null ? String(p.soldCount) : '',
    reviewCount: p.reviewCount != null ? String(p.reviewCount) : '',
    rating: p.rating ? `${Math.floor(p.rating / 10)}.${p.rating % 10}` : '',
    videoUrl: p.videoUrl || '',
    videoPoster: p.videoPoster || null,
    sections: (p.sections || []).map((x) => ({
      images: x.images || [],
      titleUz: x.titleUz || '',
      titleRu: x.titleRu || '',
      textUz: x.textUz || '',
      textRu: x.textRu || '',
    })),
    comparison: p.comparison
      ? {
          ...EMPTY_COMPARISON,
          ...p.comparison,
          rows: (p.comparison.rows || []).map((r) => ({
            aspectUz: r.aspectUz || '',
            aspectRu: r.aspectRu || '',
            cheapUz: r.cheapUz || '',
            cheapRu: r.cheapRu || '',
            premiumUz: r.premiumUz || '',
            premiumRu: r.premiumRu || '',
          })),
        }
      : null,
  };
}

// Brauzerda oldindan tekshirish (server baribir o'zi ham tekshiradi)
const anyImage = (u) => /^\/uploads\//.test(u) || /^data:image\//.test(u) || /^blob:/.test(u);
const anyVideo = (u) => /^\/uploads\/[a-f0-9]{32}\.(mp4|webm|mov)$/.test(u) || /^blob:/.test(u) || /^data:video\//.test(u);

const FIELD_NAMES = {
  nameUz: 'O‘zbekcha nom',
  nameRu: 'Ruscha nom',
  slug: 'Sahifa manzili',
  price: 'Narx',
  oldPrice: 'Eski narx',
  mainImage: 'Asosiy rasm',
  gallery: 'Qo‘shimcha rasmlar',
  category: 'Kategoriya',
  descUz: 'Tavsif (o‘zbekcha)',
  descRu: 'Tavsif (ruscha)',
  features: 'Xususiyatlar',
  uzumUrl: 'Uzum havolasi',
  taglineUz: 'Shior (o‘zbekcha)',
  taglineRu: 'Shior (ruscha)',
  soldCount: 'Sotilgan soni',
  reviewCount: 'Sharhlar soni',
  rating: 'Reyting',
  videoUrl: 'Video',
  videoPoster: 'Video muqovasi',
  sections: 'Bo‘limlar',
  comparison: 'Taqqoslash',
};

// Yangi qo'shilgan mahsulot: tahrirlash sahifasida "qo'shildi" bloki ko'rsatiladi
let justCreatedId = null;

const ORDER = ['nameUz', 'nameRu', 'slug', 'price', 'oldPrice', 'mainImage', 'gallery', 'category', 'descUz', 'descRu', 'features', 'taglineUz', 'taglineRu', 'soldCount', 'reviewCount', 'rating', 'videoUrl', 'videoPoster', 'sections', 'comparison', 'uzumUrl'];

export default function ProductForm({ id, onUnauthorized }) {
  const toast = useToast();
  const isNew = !id;
  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(JSON.stringify(EMPTY));
  const [meta, setMeta] = useState(null); // {id, slug, createdAt, updatedAt, status}
  const [loadState, setLoadState] = useState(isNew ? 'ready' : 'loading');
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [leaveTo, setLeaveTo] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const formRef = useRef(null);

  const dirty = JSON.stringify(form) !== initial;
  const errorKeys = ORDER.filter((k) => errors[k]);

  useEffect(() => {
    if (isNew) return;
    api(`/api/admin/products/${id}`)
      .then(({ product }) => {
        const f = fromProduct(product);
        setForm(f);
        setInitial(JSON.stringify(f));
        setMeta(product);
        setLoadState('ready');
      })
      .catch((err) => {
        if (err.status === 401) return onUnauthorized();
        setLoadError(err.status === 404 ? 'Bu mahsulot topilmadi — ehtimol o‘chirilgan.' : err.message);
        setLoadState('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Saqlanmagan o'zgarishlar bilan chiqib ketishdan himoya
  useEffect(() => {
    if (!dirty) {
      setLeaveGuard(null);
      return;
    }
    setLeaveGuard((to) => {
      setLeaveTo(to);
      return false;
    });
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      setLeaveGuard(null);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [dirty]);

  const set = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'nameUz' && !slugTouched) next.slug = slugify(value);
      return next;
    });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const discount = useMemo(() => {
    const p = Number(form.price);
    const o = Number(form.oldPrice);
    return form.oldPrice ? discountPercent(p, o) : 0;
  }, [form.price, form.oldPrice]);

  const scrollToFirstError = (errs) => {
    const first = ORDER.find((k) => errs[k]);
    if (!first) return;
    const el = formRef.current?.querySelector(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.querySelector('input, textarea, select, button')?.focus({ preventScroll: true });
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (uploads > 0) {
      toast('Rasmlar yuklanishini kuting', 'error');
      return false;
    }
    const payload = { ...form, slug: form.slug.trim() };
    const { errors: localErrors } = validateProduct(payload, { isImage: anyImage, isVideo: anyVideo });
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      toast(`To‘ldiring: ${ORDER.filter((k) => localErrors[k]).map((k) => FIELD_NAMES[k]).join(', ')}`, 'error');
      scrollToFirstError(localErrors);
      return false;
    }
    setSaving(true);
    try {
      const { product } = await api(isNew ? '/api/admin/products' : `/api/admin/products/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: payload,
      });
      const f = fromProduct(product);
      setForm(f);
      setInitial(JSON.stringify(f));
      setMeta(product);
      setErrors({});
      setSlugTouched(true);
      invalidateProducts();
      toast(
        product.status === 'active'
          ? isNew
            ? 'Mahsulot qo‘shildi va saytda ko‘rinmoqda'
            : 'Saqlandi — saytda yangilandi'
          : 'Saqlandi. Mahsulot yashirilgan — saytda ko‘rinmaydi',
      );
      if (isNew) {
        justCreatedId = product.id;
        setLeaveGuard(null);
        navigate(ROUTES.adminEdit(product.id), { replace: true, force: true });
      }
      return true;
    } catch (err) {
      if (err.status === 401) {
        onUnauthorized();
        return false;
      }
      setErrors(err.fields || {});
      toast(err.message, 'error');
      scrollToFirstError(err.fields || {});
      return false;
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleteOpen(false);
    try {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' });
      invalidateProducts();
      toast(`"${form.nameUz}" butunlay o‘chirildi`);
      setLeaveGuard(null);
      navigate(ROUTES.adminProducts, { replace: true, force: true });
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      toast(err.message, 'error');
    }
  };

  const hideFromDelete = async () => {
    setDeleteOpen(false);
    try {
      const { product } = await api(`/api/admin/products/${id}`, { method: 'PATCH', body: { status: 'hidden' } });
      const f = { ...form, status: 'hidden' };
      setForm(f);
      setInitial(JSON.stringify({ ...JSON.parse(initial), status: 'hidden' }));
      setMeta(product);
      invalidateProducts();
      toast('Mahsulot yashirildi — saytda ko‘rinmaydi');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loadState === 'loading') {
    return (
      <div className="a-center">
        <Spinner size={28} />
      </div>
    );
  }
  if (loadState === 'error') {
    return (
      <div className="a-page">
        <h1 className="a-title">Mahsulotni ochib bo‘lmadi</h1>
        <p className="a-sub">{loadError}</p>
        <Link to={ROUTES.adminProducts} className="btn btn-ghost">
          Mahsulotlar ro‘yxatiga
        </Link>
      </div>
    );
  }

  const urlPreview = `/product/${form.slug || '…'}`;
  const uzumMissing = !form.uzumUrl.trim();
  const uzumInvalid = form.uzumUrl.trim() && !isUzumUrl(form.uzumUrl.trim());

  return (
    <div className="a-page a-form-page">
      <header className="a-head">
        <div>
          <Link to={ROUTES.adminProducts} className="a-back">
            <Icon name="arrow" size={16} className="flip" /> Mahsulotlar
          </Link>
          <h1 className="a-title">{isNew ? 'Yangi mahsulot' : form.nameUz || 'Mahsulotni tahrirlash'}</h1>
          {meta && (
            <p className="a-sub">
              Yaratilgan: {formatDate(meta.createdAt)} · Oxirgi o‘zgarish: {formatDate(meta.updatedAt)}
            </p>
          )}
        </div>
        {meta && meta.status === 'active' && (
          <SiteLink className="btn btn-ghost" to={ROUTES.product(meta.slug)}>
            <Icon name="external" size={18} /> Saytda ko‘rish
          </SiteLink>
        )}
      </header>

      {meta && justCreatedId === meta.id && (
        <div className="a-success" role="status">
          <span className="a-success-icon">
            <Icon name="check" size={22} />
          </span>
          <div className="a-success-text">
            <strong>Mahsulot qo‘shildi!</strong>
            <span>
              {meta.status === 'active'
                ? 'U katalogda birinchi bo‘lib ko‘rinadi.' + (meta.featured ? ' Bosh sahifada ham chiqadi.' : '')
                : 'Mahsulot yashirilgan — saytda ko‘rinishi uchun “Faol” qiling va saqlang.'}
            </span>
          </div>
          <div className="a-success-actions">
            {meta.status === 'active' && (
              <SiteLink className="btn btn-primary" to={ROUTES.product(meta.slug)}>
                <Icon name="external" size={17} /> Saytda ko‘rish
              </SiteLink>
            )}
            <Link to={ROUTES.adminNew} className="btn btn-ghost" onClick={() => (justCreatedId = null)}>
              <Icon name="plus" size={17} /> Yana qo‘shish
            </Link>
          </div>
        </div>
      )}

      <form ref={formRef} className="a-form a-product-form" onSubmit={submit} noValidate>
        <div className="a-form-main">
          <section className="a-card">
            <h2 className="a-card-title">Asosiy ma’lumotlar</h2>
            <div className="a-grid-2">
              <Field id="nameUz" label="Mahsulot nomi — o‘zbekcha" error={errors.nameUz}>
                <input id="nameUz" className="a-input" value={form.nameUz} maxLength={LIMITS.name} onChange={(e) => set('nameUz', e.target.value)} aria-invalid={!!errors.nameUz} />
              </Field>
              <Field id="nameRu" label="Mahsulot nomi — ruscha" optional hint="Bo‘sh qolsa, o‘zbekcha nom ishlatiladi" error={errors.nameRu}>
                <input id="nameRu" className="a-input" value={form.nameRu} maxLength={LIMITS.name} onChange={(e) => set('nameRu', e.target.value)} aria-invalid={!!errors.nameRu} lang="ru" />
              </Field>
            </div>
            <Field
              id="slug"
              label="Sahifa manzili (slug)"
              hint={
                <>
                  Mahsulot sahifasi: <code>{urlPreview}</code>.{' '}
                  {!isNew && 'Manzilni o‘zgartirsangiz, eski havola ham yangisiga yo‘naltiriladi.'}
                </>
              }
              error={errors.slug}
            >
              <div className="a-input-wrap">
                <span className="a-prefix">/product/</span>
                <input
                  id="slug"
                  className="a-input a-mono has-prefix"
                  value={form.slug}
                  maxLength={LIMITS.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-'));
                  }}
                  aria-invalid={!!errors.slug}
                  spellCheck="false"
                  autoCapitalize="none"
                />
                <button
                  type="button"
                  className="a-input-btn a-input-btn-text"
                  onClick={() => {
                    setSlugTouched(false);
                    set('slug', slugify(form.nameUz));
                  }}
                  title="Nomdan avtomatik yaratish"
                >
                  Nomdan
                </button>
              </div>
            </Field>
            <Field id="category" label="Kategoriya" error={errors.category}>
              <select id="category" className="a-input a-select" value={form.category} onChange={(e) => set('category', e.target.value)} aria-invalid={!!errors.category}>
                <option value="">Tanlang…</option>
                {CATEGORY_IDS.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Narx</h2>
            <div className="a-grid-2">
              <Field id="price" label="Joriy narx" error={errors.price} hint="So‘mda, butun son">
                <div className="a-input-wrap">
                  <input
                    id="price"
                    className="a-input a-num has-suffix"
                    inputMode="numeric"
                    value={formatSum(form.price)}
                    onChange={(e) => set('price', digitsOnly(e.target.value))}
                    aria-invalid={!!errors.price}
                    placeholder="249 000"
                  />
                  <span className="a-suffix">so‘m</span>
                </div>
              </Field>
              <Field
                id="oldPrice"
                label="Eski narx"
                optional
                error={errors.oldPrice}
                hint={discount > 0 ? `Saytda chegirma ko‘rsatiladi: −${discount}%` : 'Faqat haqiqiy chegirma bo‘lsa kiriting'}
              >
                <div className="a-input-wrap">
                  <input
                    id="oldPrice"
                    className="a-input a-num has-suffix"
                    inputMode="numeric"
                    value={formatSum(form.oldPrice)}
                    onChange={(e) => set('oldPrice', digitsOnly(e.target.value))}
                    aria-invalid={!!errors.oldPrice}
                    placeholder="—"
                  />
                  <span className="a-suffix">so‘m</span>
                  {form.oldPrice && (
                    <button type="button" className="a-input-btn" onClick={() => set('oldPrice', '')} aria-label="Eski narxni olib tashlash" title="Olib tashlash">
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
              </Field>
            </div>
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Rasmlar</h2>
            <Field id="mainImage" label="Asosiy rasm" hint="Katalog va mahsulot sahifasidagi katta rasm. Kvadrat, to‘q fonli rasm eng chiroyli ko‘rinadi">
              <ImageField
                id="mainImage"
                value={form.mainImage}
                onChange={(v) => set('mainImage', v)}
                onBusyChange={(d) => setUploads((n) => n + d)}
                error={errors.mainImage}
              />
            </Field>
            <Field id="gallery" label="Qo‘shimcha rasmlar" optional hint={`Ko‘pi bilan ${LIMITS.gallery} ta. Tartibini strelkalar bilan o‘zgartiring, ⭐ — asosiy qilish`}>
              <ImageField
                id="gallery"
                multiple
                max={LIMITS.gallery}
                value={form.gallery}
                onChange={(v) => set('gallery', v)}
                onBusyChange={(d) => setUploads((n) => n + d)}
                onMakeMain={(src) => {
                  setForm((f) => ({
                    ...f,
                    mainImage: src,
                    gallery: [f.mainImage, ...f.gallery.filter((g) => g !== src)].filter(Boolean),
                  }));
                }}
                error={errors.gallery}
              />
            </Field>
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Tavsif</h2>
            <Field id="descUz" label="Tavsif — o‘zbekcha" optional error={errors.descUz} hint="Bo‘sh qator yangi xatboshi boshlaydi">
              <textarea id="descUz" className="a-input a-textarea" rows={6} maxLength={LIMITS.desc} value={form.descUz} onChange={(e) => set('descUz', e.target.value)} />
            </Field>
            <Field id="descRu" label="Tavsif — ruscha" optional error={errors.descRu}>
              <textarea id="descRu" className="a-input a-textarea" rows={6} maxLength={LIMITS.desc} value={form.descRu} onChange={(e) => set('descRu', e.target.value)} lang="ru" />
            </Field>
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Xususiyatlari</h2>
            <Field
              id="features"
              label="Xususiyatlar ro‘yxati"
              optional
              error={errors.features}
              hint="Masalan: “Sig‘imi: 10 000 mAh”. Ikki nuqta qo‘ysangiz, saytda jadval ko‘rinishida chiqadi"
            >
              <div className="a-features">
                {form.features.map((f, i) => (
                  <div className="a-feature" key={i}>
                    <span className="a-feature-num">{i + 1}</span>
                    <input
                      id={`feature-uz-${i}`}
                      className="a-input"
                      placeholder="O‘zbekcha"
                      value={f.uz}
                      maxLength={LIMITS.feature}
                      onChange={(e) => set('features', form.features.map((x, j) => (j === i ? { ...x, uz: e.target.value } : x)))}
                    />
                    <input
                      id={`feature-ru-${i}`}
                      className="a-input"
                      placeholder="Ruscha"
                      lang="ru"
                      value={f.ru}
                      maxLength={LIMITS.feature}
                      onChange={(e) => set('features', form.features.map((x, j) => (j === i ? { ...x, ru: e.target.value } : x)))}
                    />
                    <button
                      type="button"
                      className="a-icon-btn"
                      onClick={() => set('features', form.features.filter((_, j) => j !== i))}
                      aria-label={`${i + 1}-xususiyatni o‘chirish`}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                ))}
                {form.features.length < LIMITS.features && (
                  <button type="button" className="a-add" onClick={() => set('features', [...form.features, { uz: '', ru: '' }])}>
                    <Icon name="plus" size={17} /> Xususiyat qo‘shish
                  </button>
                )}
              </div>
            </Field>
          </section>

          <div className="a-group-title">
            <Icon name="spark" size={18} />
            <div>
              <h2>Landing sahifa</h2>
              <p>Reklamadan kelgan mijoz ko‘radigan bo‘limlar. To‘ldirilmagan bo‘lim saytda chiqmaydi.</p>
            </div>
          </div>

          <section className="a-card">
            <h2 className="a-card-title">Shior</h2>
            <TaglineFields form={form} set={set} errors={errors} />
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Uzum Market statistikasi</h2>
            <StatsFields form={form} set={set} errors={errors} />
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Video</h2>
            <VideoField form={form} set={set} errors={errors} onBusyChange={(d) => setUploads((n) => n + d)} />
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Afzalliklar bo‘limlari</h2>
            <p className="a-sub a-card-lead">Har bir bo‘lim: rasm + sarlavha + qisqa matn. Saytda rasm va matn navbatma-navbat joylashadi.</p>
            <SectionsEditor form={form} set={set} errors={errors} onBusyChange={(d) => setUploads((n) => n + d)} />
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Arzon analog bilan taqqoslash</h2>
            <ComparisonEditor form={form} set={set} errors={errors} onBusyChange={(d) => setUploads((n) => n + d)} />
          </section>
        </div>

        <aside className="a-form-side">
          <section className="a-card">
            <h2 className="a-card-title">Uzum Market</h2>
            <Field id="uzumUrl" label="Mahsulot havolasi" error={errors.uzumUrl} hint="Uzum Market’dagi aynan shu mahsulot sahifasining manzilini nusxalab qo‘ying">
              <input
                id="uzumUrl"
                className="a-input"
                type="url"
                inputMode="url"
                placeholder="https://uzum.uz/uz/product/..."
                value={form.uzumUrl}
                onChange={(e) => set('uzumUrl', e.target.value)}
                aria-invalid={!!errors.uzumUrl}
                spellCheck="false"
              />
            </Field>
            {uzumMissing && (
              <p className="a-warn-box">
                <Icon name="warning" size={17} />
                <span>Havola yo‘q — saytda xarid tugmasi ko‘rinmaydi, o‘rniga “Tez orada Uzum Market’da” yozuvi chiqadi.</span>
              </p>
            )}
            {!uzumMissing && !uzumInvalid && (
              <a className="a-mini-btn" href={form.uzumUrl.trim()} target="_blank" rel="noopener noreferrer">
                <Icon name="external" size={15} /> Havolani tekshirish
              </a>
            )}
          </section>

          <section className="a-card">
            <h2 className="a-card-title">Ko‘rinish</h2>
            <Toggle
              id="status"
              checked={form.status === 'active'}
              onChange={(v) => set('status', v ? 'active' : 'hidden')}
              label={form.status === 'active' ? 'Faol — saytda ko‘rinadi' : 'Yashirilgan'}
              description={form.status === 'active' ? 'Katalog, qidiruv va mahsulot sahifasida chiqadi' : 'Saytda ko‘rinmaydi, ma’lumotlari saqlanadi'}
            />
            <Toggle
              id="featured"
              checked={form.featured}
              onChange={(v) => set('featured', v)}
              label="Bosh sahifada ko‘rsatish"
              description="“Tanlangan mahsulotlar” blokida chiqadi (faol bo‘lsa)"
            />
          </section>

          {!isNew && (
            <section className="a-card a-danger-zone">
              <h2 className="a-card-title">O‘chirish</h2>
              <p className="a-sub">Vaqtincha kerak bo‘lmasa, o‘chirish o‘rniga yashirish tavsiya etiladi.</p>
              <button type="button" className="btn btn-ghost btn-danger-ghost" onClick={() => setDeleteOpen(true)}>
                <Icon name="trash" size={17} /> Mahsulotni o‘chirish
              </button>
            </section>
          )}
        </aside>

        <div className="a-savebar">
          {errorKeys.length > 0 && uploads === 0 ? (
            <button type="button" className="a-savebar-state is-error" onClick={() => scrollToFirstError(errors)}>
              <Icon name="warning" size={16} />
              <span>
                To‘ldiring: <b>{errorKeys.map((k) => FIELD_NAMES[k] || k).join(', ')}</b>
              </span>
            </button>
          ) : (
            <span className="a-savebar-state">
              {uploads > 0 ? (
                <>
                  <Spinner size={16} /> Rasm yuklanmoqda…
                </>
              ) : dirty ? (
                <>
                  <span className="dot dot-warn" /> Saqlanmagan o‘zgarishlar bor
                </>
              ) : (
                <>
                  <span className="dot dot-ok" /> {isNew ? 'Nom, narx va kategoriyani kiriting' : 'Barcha o‘zgarishlar saqlangan'}
                </>
              )}
            </span>
          )}
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving || uploads > 0 || (!isNew && !dirty)}>
            {saving ? <Spinner /> : <Icon name="check" size={18} />} {isNew ? 'Mahsulotni qo‘shish' : 'Saqlash'}
          </button>
        </div>
      </form>

      <Dialog
        open={Boolean(leaveTo)}
        title="Saqlanmagan o‘zgarishlar bor"
        onClose={() => setLeaveTo(null)}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary"
              data-autofocus
              onClick={async () => {
                const to = leaveTo;
                setLeaveTo(null);
                const saved = await submit();
                if (saved && !isNew) navigate(to, { force: true });
              }}
            >
              Saqlash
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                const to = leaveTo;
                setLeaveTo(null);
                setLeaveGuard(null);
                navigate(to, { force: true });
              }}
            >
              Saqlamasdan chiqish
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setLeaveTo(null)}>
              Qolish
            </button>
          </>
        }
      >
        <p>Sahifadan chiqsangiz, kiritilgan o‘zgarishlar yo‘qoladi.</p>
      </Dialog>

      <DeleteDialog
        product={deleteOpen ? { name: { uz: form.nameUz }, status: meta?.status } : null}
        onClose={() => setDeleteOpen(false)}
        onHide={hideFromDelete}
        onDelete={doDelete}
      />
    </div>
  );
}
