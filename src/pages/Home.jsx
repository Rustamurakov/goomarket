import { useLang } from '../i18n/LanguageContext.jsx';
import { useSeo } from '../lib/useSeo.js';
import { Link, ROUTES } from '../lib/router.jsx';
import { CATEGORIES, CATEGORY_ART } from '../data/products.js';
import { useProducts } from '../lib/products-store.jsx';
import { HeroArt } from '../components/HeroArt.jsx';
import { ProductArt } from '../components/ProductArt.jsx';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard.jsx';
import { Icon } from '../components/Icons.jsx';
import { CtaBanner, SectionHead, ValueGrid } from '../components/Blocks.jsx';


export default function Home() {
  const { lang, t } = useLang();
  useSeo({ ...t.seo.home, lang });
  const { products, status } = useProducts();
  // Admin "Bosh sahifada ko'rsatish" belgisini qo'ygan faol mahsulotlar
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const showFeatured = status === 'loading' || featured.length > 0;

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1 className="hero-title">GooMarket</h1>
            <p className="hero-tagline">{t.hero.tagline}</p>
            <p className="hero-text">{t.hero.text}</p>
            <div className="btn-row">
              <Link to={ROUTES.products} className="btn btn-primary btn-lg">
                {t.hero.primary} <Icon name="arrow" size={18} />
              </Link>
              <Link to={ROUTES.about} className="btn btn-ghost btn-lg">
                {t.hero.secondary}
              </Link>
            </div>
            <ul className="hero-chips" aria-label={t.home.categoriesTitle}>
              {t.hero.chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="hero-visual">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead
            eyebrow={t.home.categoriesEyebrow}
            title={t.home.categoriesTitle}
            link={t.home.categoriesLink}
            linkTo={ROUTES.products}
          />
          <ul className="category-grid">
            {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
              <li key={c.id}>
                <Link to={`${ROUTES.products}?cat=${c.id}`} className="category-tile">
                  <span className="category-art">
                    <ProductArt {...CATEGORY_ART[c.id]} />
                  </span>
                  <span className="category-name">{t.categories[c.id]}</span>
                  <Icon name="arrow" size={18} className="category-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showFeatured && (
        <section className="section">
          <div className="container">
            <SectionHead
              eyebrow={t.home.featuredEyebrow}
              title={t.home.featuredTitle}
              link={t.home.featuredLink}
              linkTo={ROUTES.products}
            />
            <div className="product-grid featured-scroller">
              {status === 'loading'
                ? Array.from({ length: 3 }, (_, i) => <ProductCardSkeleton key={i} />)
                : featured.map((p) => <ProductCard key={p.id} product={p} placement="home_featured" />)}
            </div>
          </div>
        </section>
      )}

      <section className="section section-alt">
        <div className="container">
          <SectionHead eyebrow={t.home.whyEyebrow} title={t.home.whyTitle} />
          <ValueGrid items={t.values} />
        </div>
      </section>

      <section className="section">
        <div className="container how-grid">
          <div>
            <p className="eyebrow">{t.home.howEyebrow}</p>
            <h2 className="section-title">{t.home.howTitle}</h2>
            <p className="section-text">{t.home.howText}</p>
          </div>
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
      </section>

      <CtaBanner title={t.home.ctaTitle} text={t.home.ctaText} button={t.home.ctaButton} to={ROUTES.products} />
    </>
  );
}
