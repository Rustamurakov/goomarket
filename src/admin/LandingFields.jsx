import { useRef, useState } from 'react';
import { LIMITS, youtubeId } from '../../shared/product-schema.js';
import { Icon } from '../components/Icons.jsx';
import { ImageField } from './ImageField.jsx';
import { uploadVideo, MAX_VIDEO_MB } from './video.js';
import { Field, Spinner, digitsOnly, formatSum } from './ui.jsx';

// =====================================================================
//  Admin formadagi "Landing sahifa" bo'limlari:
//  shior, Uzum statistikasi, video va afzallik bo'limlari.
// =====================================================================

export function TaglineFields({ form, set, errors }) {
  return (
    <div className="a-grid-2">
      <Field id="taglineUz" label="Qisqa shior — o‘zbekcha" optional error={errors.taglineUz} hint="Nom ostida chiqadi. Mahsulotning asosiy foydasini bir gapda ayting">
        <input id="taglineUz" className="a-input" maxLength={LIMITS.tagline} value={form.taglineUz} onChange={(e) => set('taglineUz', e.target.value)} />
      </Field>
      <Field id="taglineRu" label="Qisqa shior — ruscha" optional error={errors.taglineRu}>
        <input id="taglineRu" className="a-input" lang="ru" maxLength={LIMITS.tagline} value={form.taglineRu} onChange={(e) => set('taglineRu', e.target.value)} />
      </Field>
    </div>
  );
}

export function StatsFields({ form, set, errors }) {
  return (
    <>
      <p className="a-warn-box a-info-box">
        <Icon name="info" size={17} />
        <span>Faqat Uzum Market’dagi haqiqiy raqamlarni kiriting. Saytda “27 000+ sotilgan” ko‘rinishida chiqadi. Bo‘sh qoldirilsa, ko‘rsatilmaydi.</span>
      </p>
      <div className="a-grid-3">
        <Field id="soldCount" label="Sotilgan soni" optional error={errors.soldCount}>
          <input id="soldCount" className="a-input a-num" inputMode="numeric" placeholder="27 000" value={formatSum(form.soldCount)} onChange={(e) => set('soldCount', digitsOnly(e.target.value))} />
        </Field>
        <Field id="reviewCount" label="Sharhlar soni" optional error={errors.reviewCount}>
          <input id="reviewCount" className="a-input a-num" inputMode="numeric" placeholder="10 000" value={formatSum(form.reviewCount)} onChange={(e) => set('reviewCount', digitsOnly(e.target.value))} />
        </Field>
        <Field id="rating" label="Reyting (1–5)" optional error={errors.rating}>
          <input
            id="rating"
            className="a-input a-num"
            inputMode="decimal"
            placeholder="4.9"
            maxLength={3}
            value={form.rating}
            onChange={(e) => set('rating', e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))}
          />
        </Field>
      </div>
    </>
  );
}

export function VideoField({ form, set, errors, onBusyChange }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [ytInput, setYtInput] = useState(youtubeId(form.videoUrl || '') ? form.videoUrl : '');
  const yt = youtubeId(form.videoUrl || '');
  const isFile = form.videoUrl && !yt;

  const onFile = async (file) => {
    if (!file) return;
    setError('');
    setProgress(0);
    onBusyChange(1);
    try {
      const url = await uploadVideo(file, setProgress);
      set('videoUrl', url);
      setYtInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
      onBusyChange(-1);
    }
  };

  return (
    <div className="a-video" data-field="videoUrl">
      {form.videoUrl && progress === null && (
        <div className="a-video-preview">
          {yt ? (
            <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="YouTube video" />
          ) : (
            <video src={form.videoUrl} controls playsInline preload="metadata" poster={form.videoPoster || undefined} />
          )}
          <div className="a-video-bar">
            <span>
              <Icon name="video" size={16} /> {yt ? 'YouTube video' : 'Yuklangan video'}
            </span>
            <button
              type="button"
              className="a-mini-btn a-mini-danger"
              onClick={() => {
                set('videoUrl', '');
                set('videoPoster', null);
                setYtInput('');
              }}
            >
              <Icon name="trash" size={15} /> Olib tashlash
            </button>
          </div>
        </div>
      )}

      {progress !== null && (
        <div className="a-progress" role="status">
          <Spinner size={16} /> Video yuklanmoqda… <b>{progress}%</b>
          <span className="a-progress-bar">
            <span style={{ width: `${progress}%` }} />
          </span>
        </div>
      )}

      {!form.videoUrl && progress === null && (
        <div className="a-video-options">
          <button type="button" id="videoUrl" className="a-drop a-drop-wide" onClick={() => inputRef.current?.click()}>
            <Icon name="upload" size={22} />
            <strong>Video fayl yuklash</strong>
            <small>MP4 (tavsiya), WEBM, MOV · {MAX_VIDEO_MB} MB gacha</small>
          </button>
          <div className="a-or">yoki</div>
          <Field id="youtubeUrl" label="YouTube havolasi" hint="youtube.com yoki youtu.be havolasini qo‘ying">
            <div className="a-input-wrap">
              <input
                id="youtubeUrl"
                className="a-input"
                type="url"
                inputMode="url"
                placeholder="https://youtu.be/..."
                value={ytInput}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setYtInput(v);
                  setError('');
                  if (youtubeId(v)) set('videoUrl', v);
                }}
                spellCheck="false"
              />
            </div>
          </Field>
          {ytInput && !youtubeId(ytInput) && <p className="a-error">YouTube havolasi noto‘g‘ri ko‘rinadi</p>}
        </div>
      )}

      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,.mov" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />

      {(error || errors.videoUrl) && (
        <p className="a-error" role="alert">
          <Icon name="warning" size={15} /> {error || errors.videoUrl}
        </p>
      )}

      {isFile && (
        <Field id="videoPoster" label="Video muqovasi" optional hint="Video ishga tushgunga qadar ko‘rinadigan rasm. Bo‘sh qolsa — asosiy rasm" error={errors.videoPoster}>
          <ImageField id="videoPoster" value={form.videoPoster} onChange={(v) => set('videoPoster', v)} onBusyChange={onBusyChange} />
        </Field>
      )}
    </div>
  );
}

const EMPTY_SECTION = { images: [], titleUz: '', titleRu: '', textUz: '', textRu: '' };

export function SectionsEditor({ form, set, errors, onBusyChange }) {
  const sections = form.sections;
  const update = (i, patch) => set('sections', sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    set('sections', next);
  };

  return (
    <div className="a-sections" data-field="sections">
      {sections.map((s, i) => (
        <div key={i} className="a-section">
          <div className="a-section-head">
            <strong>{i + 1}-bo‘lim</strong>
            <div className="a-section-tools">
              <button type="button" className="a-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yuqoriga" title="Yuqoriga">
                <Icon name="arrow" size={16} className="rot-up" />
              </button>
              <button type="button" className="a-icon-btn" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Pastga" title="Pastga">
                <Icon name="arrow" size={16} className="rot-down" />
              </button>
              <button type="button" className="a-icon-btn a-icon-danger" onClick={() => set('sections', sections.filter((_, j) => j !== i))} aria-label={`${i + 1}-bo‘limni o‘chirish`} title="O‘chirish">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
          <Field id={`section-img-${i}`} label="Rasm (1 yoki 2 ta)" hint="2 ta rasm yonma-yon chiqadi">
            <ImageField id={`section-img-${i}`} multiple max={LIMITS.sectionImages} value={s.images} onChange={(v) => update(i, { images: v })} onBusyChange={onBusyChange} />
          </Field>
          <div className="a-grid-2">
            <Field id={`section-tuz-${i}`} label="Sarlavha — o‘zbekcha">
              <input id={`section-tuz-${i}`} className="a-input" maxLength={LIMITS.sectionTitle} value={s.titleUz} onChange={(e) => update(i, { titleUz: e.target.value })} />
            </Field>
            <Field id={`section-tru-${i}`} label="Sarlavha — ruscha" optional>
              <input id={`section-tru-${i}`} className="a-input" lang="ru" maxLength={LIMITS.sectionTitle} value={s.titleRu} onChange={(e) => update(i, { titleRu: e.target.value })} />
            </Field>
            <Field id={`section-xuz-${i}`} label="Matn — o‘zbekcha" optional>
              <textarea id={`section-xuz-${i}`} className="a-input a-textarea" rows={4} maxLength={LIMITS.sectionText} value={s.textUz} onChange={(e) => update(i, { textUz: e.target.value })} />
            </Field>
            <Field id={`section-xru-${i}`} label="Matn — ruscha" optional>
              <textarea id={`section-xru-${i}`} className="a-input a-textarea" rows={4} lang="ru" maxLength={LIMITS.sectionText} value={s.textRu} onChange={(e) => update(i, { textRu: e.target.value })} />
            </Field>
          </div>
        </div>
      ))}
      {errors.sections && (
        <p className="a-error" role="alert">
          <Icon name="warning" size={15} /> {errors.sections}
        </p>
      )}
      {sections.length < LIMITS.sections && (
        <button type="button" className="a-add" onClick={() => set('sections', [...sections, { ...EMPTY_SECTION }])}>
          <Icon name="plus" size={17} /> Bo‘lim qo‘shish
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
//  Taqqoslash: arzon analog va shu mahsulot (premium)
// ---------------------------------------------------------------------
export const EMPTY_COMPARISON = {
  titleUz: '',
  titleRu: '',
  cheapLabelUz: '',
  cheapLabelRu: '',
  premiumLabelUz: '',
  premiumLabelRu: '',
  cheapImage: null,
  premiumImage: null,
  rows: [],
};
const EMPTY_ROW = { aspectUz: '', aspectRu: '', cheapUz: '', cheapRu: '', premiumUz: '', premiumRu: '' };

export function ComparisonEditor({ form, set, errors, onBusyChange }) {
  const c = form.comparison || EMPTY_COMPARISON;
  const upd = (patch) => set('comparison', { ...c, ...patch });
  const rows = c.rows;
  const updRow = (i, patch) => upd({ rows: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const moveRow = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    upd({ rows: next });
  };
  const T = LIMITS.compareText;
  const input = (id, value, onChange, props = {}) => (
    <input id={id} className="a-input" maxLength={T} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
  );

  return (
    <div className="a-compare" data-field="comparison">
      <p className="a-warn-box a-info-box">
        <Icon name="info" size={17} />
        <span>
          Saytda ikki ustun bo‘lib chiqadi: chapda arzon analog (✗), o‘ngda shu mahsulot (✓). Kamida bitta qator qo‘shilsa, blok
          ko‘rinadi. Rasm qo‘yilmasa, arzon analog uchun chizma, mahsulot uchun asosiy rasm ishlatiladi.
        </span>
      </p>

      <div className="a-grid-2">
        <Field id="cmp-title-uz" label="Sarlavha — o‘zbekcha" optional hint="Bo‘sh qolsa: “Arzon analog yoki [mahsulot nomi]?”">
          {input('cmp-title-uz', c.titleUz, (v) => upd({ titleUz: v }), { placeholder: 'Arzon quloqchin yoki Pods Pro 2 Premium?' })}
        </Field>
        <Field id="cmp-title-ru" label="Sarlavha — ruscha" optional>
          {input('cmp-title-ru', c.titleRu, (v) => upd({ titleRu: v }), { lang: 'ru' })}
        </Field>
      </div>

      <div className="a-compare-sides">
        <div className="a-compare-side is-cheap">
          <strong className="a-side-title">
            <span className="cmp-mark no">
              <Icon name="close" size={12} />
            </span>
            Arzon analog
          </strong>
          {input('cmp-cheap-uz', c.cheapLabelUz, (v) => upd({ cheapLabelUz: v }), { placeholder: 'Nomi (o‘zbekcha): Arzon quloqchin', maxLength: 60, 'aria-label': 'Arzon analog nomi, o‘zbekcha' })}
          {input('cmp-cheap-ru', c.cheapLabelRu, (v) => upd({ cheapLabelRu: v }), { placeholder: 'Nomi (ruscha)', maxLength: 60, lang: 'ru', 'aria-label': 'Arzon analog nomi, ruscha' })}
          <ImageField id="cmp-cheap-img" value={c.cheapImage} onChange={(v) => upd({ cheapImage: v })} onBusyChange={onBusyChange} />
        </div>
        <div className="a-compare-side is-premium">
          <strong className="a-side-title">
            <span className="cmp-mark yes">
              <Icon name="check" size={12} />
            </span>
            Shu mahsulot
          </strong>
          {input('cmp-prem-uz', c.premiumLabelUz, (v) => upd({ premiumLabelUz: v }), { placeholder: 'Bo‘sh qolsa — mahsulot nomi', maxLength: 60, 'aria-label': 'Premium nomi, o‘zbekcha' })}
          {input('cmp-prem-ru', c.premiumLabelRu, (v) => upd({ premiumLabelRu: v }), { placeholder: 'Nomi (ruscha)', maxLength: 60, lang: 'ru', 'aria-label': 'Premium nomi, ruscha' })}
          <ImageField id="cmp-prem-img" value={c.premiumImage} onChange={(v) => upd({ premiumImage: v })} onBusyChange={onBusyChange} />
        </div>
      </div>

      <div className="a-cmp-rows">
        {rows.map((r, i) => (
          <div key={i} className="a-cmp-row">
            <div className="a-section-head">
              <strong>{i + 1}-farq</strong>
              <div className="a-section-tools">
                <button type="button" className="a-icon-btn" onClick={() => moveRow(i, -1)} disabled={i === 0} aria-label="Yuqoriga" title="Yuqoriga">
                  <Icon name="arrow" size={16} className="rot-up" />
                </button>
                <button type="button" className="a-icon-btn" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} aria-label="Pastga" title="Pastga">
                  <Icon name="arrow" size={16} className="rot-down" />
                </button>
                <button type="button" className="a-icon-btn a-icon-danger" onClick={() => upd({ rows: rows.filter((_, j) => j !== i) })} aria-label={`${i + 1}-farqni o‘chirish`} title="O‘chirish">
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
            <div className="a-cmp-grid">
              <span className="a-cmp-label">Nima solishtiriladi</span>
              {input(`cmp-a-uz-${i}`, r.aspectUz, (v) => updRow(i, { aspectUz: v }), { placeholder: 'Masalan: Shovqinni qaytarish', 'aria-label': `${i + 1}-farq: nima solishtiriladi, o‘zbekcha` })}
              {input(`cmp-a-ru-${i}`, r.aspectRu, (v) => updRow(i, { aspectRu: v }), { placeholder: 'Ruscha', lang: 'ru', 'aria-label': `${i + 1}-farq: nima solishtiriladi, ruscha` })}

              <span className="a-cmp-label is-cheap">✗ Arzon analogda</span>
              {input(`cmp-c-uz-${i}`, r.cheapUz, (v) => updRow(i, { cheapUz: v }), { placeholder: 'Masalan: Yo‘q', 'aria-label': `${i + 1}-farq: arzon analog, o‘zbekcha` })}
              {input(`cmp-c-ru-${i}`, r.cheapRu, (v) => updRow(i, { cheapRu: v }), { placeholder: 'Ruscha', lang: 'ru', 'aria-label': `${i + 1}-farq: arzon analog, ruscha` })}

              <span className="a-cmp-label is-premium">✓ Shu mahsulotda</span>
              {input(`cmp-p-uz-${i}`, r.premiumUz, (v) => updRow(i, { premiumUz: v }), { placeholder: 'Masalan: Faol shovqin qaytarish (ANC)', 'aria-label': `${i + 1}-farq: shu mahsulot, o‘zbekcha` })}
              {input(`cmp-p-ru-${i}`, r.premiumRu, (v) => updRow(i, { premiumRu: v }), { placeholder: 'Ruscha', lang: 'ru', 'aria-label': `${i + 1}-farq: shu mahsulot, ruscha` })}
            </div>
          </div>
        ))}
      </div>

      {errors.comparison && (
        <p className="a-error" role="alert">
          <Icon name="warning" size={15} /> {errors.comparison}
        </p>
      )}
      {rows.length < LIMITS.compareRows && (
        <button type="button" className="a-add" onClick={() => upd({ rows: [...rows, { ...EMPTY_ROW }] })}>
          <Icon name="plus" size={17} /> Farq qo‘shish
        </button>
      )}
    </div>
  );
}
