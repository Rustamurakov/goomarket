import { useRef, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { ACCEPTED, MAX_INPUT_MB, uploadImage } from './image.js';
import { Spinner } from './ui.jsx';

/**
 * Rasm yuklash maydoni.
 * - `multiple` bo'lmasa: bitta asosiy rasm.
 * - `multiple` bo'lsa: qo'shimcha rasmlar galereyasi.
 * Yuklanayotgan rasm darhol preview sifatida ko'rinadi.
 */
export function ImageField({ id, value, onChange, multiple = false, max = 8, onBusyChange, onMakeMain, error }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState([]); // [{key, preview}]
  const [localError, setLocalError] = useState('');
  const [drag, setDrag] = useState(false);
  const images = multiple ? value || [] : value ? [value] : [];
  const room = multiple ? max - images.length - uploading.length : images.length || uploading.length ? 0 : 1;

  const handleFiles = async (fileList) => {
    setLocalError('');
    let files = Array.from(fileList || []);
    if (!files.length) return;
    if (multiple && files.length > room) {
      setLocalError(`Yana ko‘pi bilan ${Math.max(room, 0)} ta rasm qo‘shish mumkin (jami ${max} ta)`);
      files = files.slice(0, Math.max(room, 0));
    }
    if (!multiple) files = files.slice(0, 1);
    if (!files.length) return;

    const jobs = files.map((file) => ({ key: Math.random().toString(36).slice(2), file, preview: URL.createObjectURL(file) }));
    setUploading((u) => [...u, ...jobs]);
    onBusyChange?.(1);

    const results = await Promise.all(
      jobs.map(async (job) => {
        try {
          return { ok: true, url: await uploadImage(job.file) };
        } catch (err) {
          return { ok: false, message: err.message };
        } finally {
          URL.revokeObjectURL(job.preview);
        }
      }),
    );
    setUploading((u) => u.filter((x) => !jobs.includes(x)));
    onBusyChange?.(-1);

    const urls = results.filter((r) => r.ok).map((r) => r.url);
    const failed = results.filter((r) => !r.ok);
    if (failed.length) setLocalError(failed.map((f) => f.message).join('. '));
    if (urls.length) onChange(multiple ? [...(value || []), ...urls] : urls[0]);
  };

  const removeAt = (i) => {
    if (multiple) onChange(images.filter((_, idx) => idx !== i));
    else onChange(null);
  };

  const move = (i, d) => {
    const next = [...images];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const shownError = error || localError;

  return (
    <div className={`a-images${multiple ? ' is-multiple' : ' is-single'}`}>
      <div className="a-image-grid">
        {images.map((src, i) => (
          <figure key={src} className="a-image">
            <img src={src} alt={multiple ? `Qo‘shimcha rasm ${i + 1}` : 'Asosiy rasm'} />
            <div className="a-image-tools">
              {multiple && (
                <>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Chapga surish" title="Chapga">
                    <Icon name="arrow" size={15} className="flip" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="O‘ngga surish" title="O‘ngga">
                    <Icon name="arrow" size={15} />
                  </button>
                  {onMakeMain && (
                    <button type="button" onClick={() => onMakeMain(src)} aria-label="Asosiy rasm qilish" title="Asosiy qilish">
                      <Icon name="star" size={15} />
                    </button>
                  )}
                </>
              )}
              <button type="button" className="danger" onClick={() => removeAt(i)} aria-label="Rasmni olib tashlash" title="Olib tashlash">
                <Icon name="trash" size={15} />
              </button>
            </div>
          </figure>
        ))}
        {uploading.map((u) => (
          <figure key={u.key} className="a-image is-uploading">
            <img src={u.preview} alt="" />
            <span className="a-image-progress">
              <Spinner /> Yuklanmoqda…
            </span>
          </figure>
        ))}
        {room > 0 && (
          <button
            type="button"
            id={id}
            className={`a-drop${drag ? ' is-drag' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFiles(e.dataTransfer.files);
            }}
            aria-describedby={shownError ? `${id}-error` : undefined}
          >
            <Icon name={multiple ? 'image' : 'upload'} size={22} />
            <strong>{multiple ? 'Rasm qo‘shish' : 'Rasm yuklash'}</strong>
            <small>JPG, PNG, WEBP · {MAX_INPUT_MB} MB gacha</small>
          </button>
        )}
      </div>
      {!multiple && images.length > 0 && !uploading.length && (
        <button type="button" className="a-mini-btn a-replace" onClick={() => inputRef.current?.click()}>
          <Icon name="upload" size={15} /> Boshqa rasm tanlash
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {shownError && (
        <p className="a-error" id={`${id}-error`} role="alert">
          <Icon name="warning" size={15} /> {shownError}
        </p>
      )}
    </div>
  );
}
