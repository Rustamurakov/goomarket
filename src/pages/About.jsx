import { useLang } from '../i18n/LanguageContext.jsx';
import { useSeo } from '../lib/useSeo.js';
import { ROUTES } from '../lib/router.jsx';
import { ProductArt } from '../components/ProductArt.jsx';
import { CtaBanner, PageHero, SectionHead, ValueGrid } from '../components/Blocks.jsx';

export default function About() {
  const { lang, t } = useLang();
  useSeo({ ...t.seo.about, lang });
  const a = t.about;

  return (
    <>
      <PageHero eyebrow={a.eyebrow} title={a.title} lead={a.lead} />

      <section className="section section-tight">
        <div className="container about-gallery" aria-hidden="true">
          <div className="gallery-tile tall">
            <ProductArt art="case" tone="violet" />
          </div>
          <div className="gallery-tile">
            <ProductArt art="earbuds" tone="light" />
          </div>
          <div className="gallery-tile">
            <ProductArt art="powerbank" tone="dark" />
          </div>
          <div className="gallery-tile wide">
            <ProductArt art="cable" tone="violet" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container mission">
          <p className="eyebrow">{a.missionEyebrow}</p>
          <h2 className="mission-title">{a.missionTitle}</h2>
          <p className="section-text">{a.missionText}</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <SectionHead eyebrow={a.valuesEyebrow} title={a.valuesTitle} />
          <ValueGrid items={a.valueList} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="GooMarket" title={a.whyTitle} />
          <ValueGrid items={t.values} />
        </div>
      </section>

      <CtaBanner title={a.ctaTitle} text={a.ctaText} button={a.ctaButton} to={ROUTES.products} />
    </>
  );
}
