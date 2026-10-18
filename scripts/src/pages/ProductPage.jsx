import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useSeo, formatPrice, keepNumbers } from '../lib/useSeo.js';
import { Link, ROUTES, navigate } from '../lib/router.jsx';
import { api } from '../lib/api.js';
import { useProducts } from '../lib/products-store.jsx';
import { buildUzumUrl, trackEvent } from '../lib/analytics.js';
import { SITE } from '../config/site.js';
import { formatRating, youtubeId } from '../../shared/product-schema.js';
import { Icon } from '../components/Icons.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { BuyButton, PriceTag, ProductImage } from '../components/ProductBits.jsx';

// =====================================================================
//  MAHSULOT LANDING SAHIFASI
//  Barcha bo'limlar admin paneldagi ma'lumotlardan quriladi. Ma'lumot
//  kiritilmagan bo'lim (video, statistika, bo'limlar...) ko'rsatilmaydi.
// =====================================================================

const pick = (obj, lang) => (obj ? obj[lang] || obj[lang === 'uz' ? 'ru' : 'uz'] || '' : '');
const countLabel = (n, lang) => `${formatPrice(n, lang)}+`;

/** Bo'sh qatorlar — xatboshilar, oddiy yangi qator — <br> */
function Paragraphs({ text }) {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p, i) => (
      <p key={i}>
        {p.split('\n').map((line, j, arr) => (
          <span key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    ));
}

/** "Sig'imi: 10 000 mAh" → ikki ustunli qator */
function FeatureRow({ text }) {
  const i = text.indexOf(':');
  if (i > 0 && i < 40) {
    return (
      <li className="feature-row">
        <span>{text.slice(0, i).trim()}</span>
        <strong>{text.slice(i + 1).trim()}</strong>
      </li>
    );
  }
  return (
    <li className="feature-row is-single">
      <Icon name="check" size={18} />
      <strong>{text}</strong>
    </li>
  );
}

function Stars({ tenths }) {
  const pct = Math.max(0, Math.min(100, (tenths / 50) * 100));
  return (
    <span className="stars" aria-hidden="true">
      <span className="stars-base">★★★★★</span>
      <span className="stars-fill" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

function Gallery({ product, name }) {
  const { t } = useLang();
  const images = useMemo(() => [product.image, ...(product.gallery || [])].filter(Boolean), [product]);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [product.id]);
  const total = images.length;
  const go = (d) => setIndex((i) => (i + d + total) % total);

  // Telefonda barmoq bilan surish
  const touch = useRef(null);
  const onTouchStart = (e) => (touch.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touch.current == null || total < 2) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touch.current = null;
  };

  return (
    <div className="pd-gallery">
      <div className="pd-main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {total ? (
          <ProductImage key={images[index]} product={product} src={images[index]} alt={name} eager={index === 0} className="pd-main-img" />
        ) : (
          <ProductImage product={product} src={null} alt={name} />
        )}
        {total > 1 && (
          <>
            <button type="button" className="pd-nav prev" onClick={() => go(-1)} aria-label={t.product.prev}>
              <Icon name="arrow" size={20} />
            </button>
            <button type="button" className="pd-nav next" onClick={() => go(1)} aria-label={t.product.next}>
              <Icon name="arrow" size={20} />
            </button>
            <span className="pd-dots" aria-label={t.product.photo(index + 1, total)}>
              {images.map((src, i) => (
                <span key={src} className={i === index ? 'is-active' : ''} />
              ))}
            </span>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="pd-thumbs" role="list">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="listitem"
              className={`pd-thumb${i === index ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={t.product.photo(i + 1, total)}
              aria-current={i === index}
            >
              <img src={src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ijtimoiy isbot: reyting, sotuvlar, sharhlar (faqat admin kiritgan Uzum raqamlari) */
function ProofRow({ product }) {
  const { lang, t } = useLang();
  const { rating, soldCount, reviewCount } = product;
  if (!rating && !soldCount && !reviewCount) return null;
  return (
    <div className="pd-proof">
      {rating > 0 && (
        <span className="pd-proof-item pd-rating">
          <Stars tenths={rating} />
          <b>{formatRating(rating)}</b>
        </span>
      )}
      {soldCount > 0 && (
        <span className="pd-proof-item">
          <b>{countLabel(soldCount, lang)}</b> {t.product.sold}
        </span>
      )}
      {reviewCount > 0 && (
        <span className="pd-proof-item">
          <b>{countLabel(reviewCount, lang)}</b> {t.product.reviews}
        </span>
      )}
    </div>
  );
}

function StatsBand({ product }) {
  const { lang, t } = useLang();
  const items = [
    product.soldCount > 0 && { value: countLabel(product.soldCount, lang), label: t.product.sold },
    product.reviewCount > 0 && { value: countLabel(product.reviewCount, lang), label: t.product.reviews },
    product.rating > 0 && { value: formatRating(product.rating), label: t.product.rating, stars: product.rating },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="lp-stats" aria-label={t.product.statsTitle}>
      <div className="container">
        <p className="eyebrow">{t.product.statsTitle}</p>
        <div className={`lp-stats-grid n-${items.length}`}>
          {items.map((it) => (
            <div key={it.label} className="lp-stat">
              <strong>{it.value}</strong>
              <span>
                {it.stars && <Stars tenths={it.stars} />}
                {it.label}
              </span>
            </div>
          ))}
        </div>
        <p className="lp-stats-source">
          <Icon name="info" size={15} /> {t.product.statsSource}
          {product.uzumUrl && (
            <>
              {' · '}
              <a href={buildUzumUrl(product)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('reviews_click', { product_id: product.id })}>
                {t.product.readReviews} <Icon name="external" size={14} />
              </a>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function VideoBlock({ product, name }) {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);
  const url = product.videoUrl;
  if (!url) return null;
  const yt = youtubeId(url);
  const poster = product.videoPoster || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : product.image) || undefined;

  return (
    <section className="lp-video" id="video">
      <div className="container">
        <div className="lp-head">
          <p className="eyebrow">{t.product.videoEyebrow}</p>
          <h2 className="lp-title">{t.product.videoTitle}</h2>
        </div>
        <div className={`lp-video-frame${yt ? ' is-youtube' : ''}`}>
          {yt ? (
            playing ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1`}
                title={name}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                className="lp-video-facade"
                onClick={() => {
                  setPlaying(true);
                  trackEvent('video_play', { product_id: product.id, source: 'youtube' });
                }}
                aria-label={t.product.videoPlay}
              >
                <img src={poster} alt="" loading="lazy" />
                <span className="lp-play">
                  <Icon name="play" size={30} />
                </span>
              </button>
            )
          ) : (
            <video
              src={url}
              poster={poster}
              controls
              playsInline
              preload="metadata"
              onPlay={() => trackEvent('video_play', { product_id: product.id, source: 'file' })}
            />
          )}
        </div>
        {yt && (
          <a className="lp-video-link" href={url} target="_blank" rel="noopener noreferrer">
            {t.product.videoOpen} <Icon name="external" size={14} />
          </a>
        )}
      </div>
    </section>
  );
}

function StorySections({ product }) {
  const { lang } = useLang();
  const sections = product.sections || [];
  if (!sections.length) return null;
  return (
    <div className="lp-stories">
      {sections.map((s, i) => {
        const title = lang === 'ru' ? s.titleRu || s.titleUz : s.titleUz || s.titleRu;
        const text = lang === 'ru' ? s.textRu || s.textUz : s.textUz || s.textRu;
        const imgs = s.images || [];
        return (
          <section key={i} className={`lp-story${i % 2 ? ' is-reverse' : ''}${imgs.length === 2 ? ' is-duo' : ''}${!imgs.length ? ' is-text' : ''}`}>
            <div className="container lp-story-grid">
              {imgs.length > 0 && (
                <div className="lp-story-media">
                  {imgs.map((src) => (
                    <img key={src} src={src} alt={title} loading="lazy" decoding="async" />
                  ))}
                </div>
              )}
              <div className="lp-story-copy">
                <h2 className="lp-title">{keepNumbers(title)}</h2>
                {text && <Paragraphs text={text} />}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Arzon analog va premium mahsulot taqqoslash bloki */
function ComparisonBlock({ product, name }) {
  const { lang, t } = useLang();
  const c = product.comparison;
  if (!c || !c.rows?.length) return null;
  const L = (uz, ru) => (lang === 'ru' ? ru || uz : uz || ru);
  const title = L(c.titleUz, c.titleRu) || t.product.compareTitle(name);
  const cheapLabel = L(c.cheapLabelUz, c.cheapLabelRu) || t.product.compareCheap;
  const premiumLabel = L(c.premiumLabelUz, c.premiumLabelRu) || name;

  return (
    <section className="section lp-compare">
      <div className="container">
        <div className="lp-head lp-compare-head">
          <p className="eyebrow">{t.product.compareEyebrow}</p>
          <h2 className="lp-title">{keepNumbers(title)}</h2>
        </div>

        <div className="cmp" role="table" aria-label={title}>
          <div className="cmp-row cmp-top" role="row">
            <div className="cmp-col is-cheap" role="columnheader">
              <div className="cmp-media">
                {c.cheapImage ? (
                  <img src={c.cheapImage} alt={cheapLabel} loading="lazy" />
                ) : (
                  <ProductImage product={{ category: product.category }} src={null} alt={cheapLabel} />
                )}
              </div>
              <strong>{cheapLabel}</strong>
            </div>
            <div className="cmp-col is-premium" role="columnheader">
              <span className="cmp-badge">{t.product.compareRecommended}</span>
              <div className="cmp-media">
                <img src={c.premiumImage || product.image} alt={premiumLabel} loading="lazy" />
              </div>
              <strong>{keepNumbers(premiumLabel)}</strong>
            </div>
          </div>

          {c.rows.map((r, i) => (
            <div key={i} className="cmp-group" role="rowgroup">
              <p className="cmp-aspect" role="rowheader">
                {L(r.aspectUz, r.aspectRu)}
              </p>
              <div className="cmp-row" role="row">
                <div className="cmp-cell is-cheap" role="cell">
                  <span className="cmp-mark no" aria-hidden="true">
                    <Icon name="close" size={14} />
                  </span>
                  <span>{L(r.cheapUz, r.cheapRu) || '—'}</span>
                </div>
                <div className="cmp-cell is-premium" role="cell">
                  <span className="cmp-mark yes" aria-hidden="true">
                    <Icon name="check" size={14} />
                  </span>
                  <span>{keepNumbers(L(r.premiumUz, r.premiumRu))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductPage({ slug }) {
  const { lang, t } = useLang();
  const { products } = useProducts();
  const cached = products.find((p) => p.slug === slug) || null;
  const [state, setState] = useState({ product: cached, status: cached ? 'ready' : 'loading' });
  const buyRef = useRef(null);
  const finalRef = useRef(null);

  // Har safar serverdan yangi ma'lumot olinadi — narx har doim dolzarb
  useEffect(() => {
    let alive = true;
    setState((s) => (s.product?.slug === slug ? s : { product: cached, status: cached ? 'ready' : 'loading' }));
    api(`/api/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!alive) return;
        if (data.redirect) return navigate(ROUTES.product(data.redirect), { replace: true });
        setState({ product: data.product, status: 'ready' });
        trackEvent('product_view', {
          product_id: data.product.id,
          product_slug: data.product.slug,
          product_name: data.product.name?.uz,
          product_category: data.product.category,
        });
      })
      .catch((err) => {
        if (!alive) return;
        setState({ product: null, status: err.status === 404 ? 'notfound' : 'error' });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const product = state.product;
  const name = product ? pick(product.name, lang) : '';
  const tagline = product ? pick(product.tagline, lang) : '';
  const desc = product ? pick(product.desc, lang) : '';

  useSeo({
    title: product ? `${name} — GooMarket` : `${t.product.notFoundTitle} — GooMarket`,
    desc: product ? (tagline || desc || name).replace(/\s+/g, ' ').slice(0, 160) : t.product.notFoundText,
    lang,
  });

  // Pastki xarid paneli landing sahifada boshidan oxirigacha doim ko'rinib turadi.
  // Panel footerni yopmasligi uchun sahifa pastiga joy qo'shiladi.
  const hasBar = Boolean(product?.uzumUrl);
  useEffect(() => {
    if (!hasBar) return;
    document.body.classList.add('has-buybar');
    return () => document.body.classList.remove('has-buybar');
  }, [hasBar]);

  const related = useMemo(() => {
    if (!product) return [];
    const others = products.filter((p) => p.id !== product.id);
    const same = others.filter((p) => p.category === product.category);
    const rest = others.filter((p) => p.category !== product.category);
    return [...same, ...rest].slice(0, 4);
  }, [products, product]);

  if (state.status === 'loading') {
    return (
      <section className="section pd" aria-busy="true">
        <div className="container pd-grid">
          <div className="pd-main sk" />
          <div className="pd-info">
            <span className="sk sk-line" />
            <span className="sk sk-title" />
            <span className="sk sk-price" />
            <span className="sk sk-btn" />
          </div>
        </div>
      </section>
    );
  }

  if (state.status === 'notfound' || state.status === 'error' || !product) {
    return (
      <section className="page-hero pd-missing">
        <div className="container">
          <p className="eyebrow">{state.status === 'error' ? t.catalog.eyebrow : '404'}</p>
          <h1 className="page-title">{state.status === 'error' ? t.product.loadError : t.product.notFoundTitle}</h1>
          <p className="page-lead">{t.product.notFoundText}</p>
          <div className="btn-row">
            <Link to={ROUTES.products} className="btn btn-primary btn-lg">
              {t.product.notFoundCta} <Icon name="arrow" size={18} />
            </Link>
            <Link to={ROUTES.home} className="btn btn-ghost btn-lg">
              {t.product.home}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const features = (product.features || []).map((f) => pick(f, lang)).filter(Boolean);
  const priceText = `${formatPrice(product.price, lang)} ${SITE.currency[lang]}`;

  return (
    <>
      {/* ---------- 1. Birinchi ekran ---------- */}
      <section className={`pd${product.uzumUrl ? ' has-buybar' : ''}`}>
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to={ROUTES.home}>{t.product.home}</Link>
            <span aria-hidden="true">/</span>
            <Link to={ROUTES.products}>{t.product.catalog}</Link>
            <span aria-hidden="true">/</span>
            <Link to={`${ROUTES.products}?cat=${product.category}`}>{t.categories[product.category]}</Link>
          </nav>

          <div className="pd-grid">
            <Gallery product={product} name={name} />

            <div className="pd-info">
              <Link to={`${ROUTES.products}?cat=${product.category}`} className="pd-category">
                {t.categories[product.category]}
              </Link>
              <h1 className="pd-title">{keepNumbers(name)}</h1>
              {tagline && <p className="pd-tagline">{tagline}</p>}
              <ProofRow product={product} />

              <div className="pd-pricebox">
                <PriceTag product={product} size="lg" />
                {product.oldPrice > product.price && (
                  <p className="pd-save">
                    {t.product.save(`${formatPrice(product.oldPrice - product.price, lang)} ${SITE.currency[lang]}`)}
                  </p>
                )}
              </div>

              <div className="pd-cta" ref={buyRef}>
                {product.uzumUrl ? (
                  <BuyButton product={product} placement="product_page" size="btn-lg" />
                ) : (
                  <div className="pd-soon">
                    <strong>{t.product.soon}</strong>
                    <p>{t.product.noLinkNote}</p>
                    <Link to={ROUTES.contact} className="btn btn-ghost">
                      {t.product.contact} <Icon name="arrow" size={18} />
                    </Link>
                  </div>
                )}
              </div>

              <ul className="pd-trust">
                {t.product.trust.map((item) => (
                  <li key={item.t}>
                    <Icon name={item.icon} size={18} />
                    <span>{item.t}</span>
                  </li>
                ))}
              </ul>

              {product.videoUrl && (
                <a href="#video" className="pd-video-jump" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('video')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  <span className="lp-play sm">
                    <Icon name="play" size={16} />
                  </span>
                  {t.product.videoTitle}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 2. Uzum statistikasi ---------- */}
      <StatsBand product={product} />

      {/* ---------- 3. Video ---------- */}
      <VideoBlock product={product} name={name} />

      {/* ---------- 4. Afzalliklar bo'limlari ---------- */}
      <StorySections product={product} />

      {/* ---------- 4b. Arzon analog bilan taqqoslash ---------- */}
      <ComparisonBlock product={product} name={name} />

      {/* ---------- 5. Xususiyatlar va tavsif ---------- */}
      {(features.length > 0 || desc) && (
        <section className="section lp-details">
          <div className="container">
            <h2 className="lp-title">{t.product.detailsTitle}</h2>
            <div className={`lp-details-grid${features.length && desc ? '' : ' is-single'}`}>
              {features.length > 0 && (
                <div className="pd-block">
                  <h3>{t.product.features}</h3>
                  <ul className="feature-list">
                    {features.map((f, i) => (
                      <FeatureRow key={i} text={f} />
                    ))}
                  </ul>
                </div>
              )}
              {desc && (
                <div className="pd-block pd-desc">
                  <h3>{t.product.description}</h3>
                  <Paragraphs text={desc} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------- 6. Xarid qanday bo'ladi + savollar ---------- */}
      <section className="section lp-help">
        <div className="container lp-help-grid">
          <div>
            <h2 className="lp-title">{t.product.howTitle}</h2>
            <ol className="steps">
              {t.home.steps.map((s, i) => (
                <li key={s.t} className="step">
                  <span className="step-num">{i + 1}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="lp-title">{t.product.faqTitle}</h2>
            <div className="faq">
              {t.product.faq.map((f, i) => (
                <details key={f.q} className="faq-item" open={i === 0}>
                  <summary>
                    {f.q}
                    <Icon name="plus" size={18} />
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 7. Yakuniy chaqiriq ---------- */}
      <section className="section lp-final-wrap" ref={finalRef}>
        <div className="container">
          <div className="lp-final">
            <div className="lp-final-media">
              <ProductImage product={product} alt="" />
            </div>
            <div className="lp-final-copy">
              <p className="eyebrow">{t.product.finalTitle}</p>
              <h2 className="lp-title">{keepNumbers(name)}</h2>
              <ProofRow product={product} />
              <PriceTag product={product} size="lg" />
              {product.uzumUrl ? (
                <>
                  <BuyButton product={product} placement="product_final" size="btn-lg" />
                  <p className="pd-note">
                    <Icon name="info" size={16} /> {t.product.finalText}
                  </p>
                </>
              ) : (
                <Link to={ROUTES.contact} className="btn btn-ghost btn-lg">
                  {t.product.contact} <Icon name="arrow" size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 8. O'xshash mahsulotlar ---------- */}
      {related.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">{t.product.related}</h2>
              <Link to={ROUTES.products} className="text-link">
                {t.product.relatedLink} <Icon name="arrow" size={18} />
              </Link>
            </div>
            <div className="product-grid featured-scroller">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} placement="related" />
              ))}
            </div>
          </div>
        </section>
      )}

      {product.uzumUrl && (
        <div className="buybar is-visible" role="region" aria-label={t.product.buyShort}>
          <div className="buybar-inner">
            <div className="buybar-info">
              <span>{name}</span>
              <strong>{priceText}</strong>
            </div>
            <BuyButton product={product} placement="product_buybar" label={t.product.buyShort} />
          </div>
        </div>
      )}
    </>
  );
}
