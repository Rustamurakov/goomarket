import { useLang } from '../i18n/LanguageContext.jsx';
import { SITE } from '../config/site.js';
import { CATEGORY_ART } from '../data/products.js';
import { discountPercent } from '../../shared/product-schema.js';
import { buildUzumUrl, trackOutbound } from '../lib/analytics.js';
import { formatPrice } from '../lib/useSeo.js';
import { Icon } from './Icons.jsx';
import { ProductArt } from './ProductArt.jsx';

/** Mahsulot rasmi; rasm yuklanmagan bo'lsa — kategoriyaga mos chizma */
export function ProductImage({ product, src, alt, eager = false, className = '' }) {
  const url = src === undefined ? product.image : src;
  if (url) {
    return (
      <img
        className={className}
        src={url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={eager ? 'high' : undefined}
        width="800"
        height="800"
      />
    );
  }
  return <ProductArt className={className} {...(CATEGORY_ART[product.category] || CATEGORY_ART.other)} label={alt} />;
}

/** Narx; eski narx faqat admin kiritgan bo'lsa ko'rsatiladi */
export function PriceTag({ product, size = 'md' }) {
  const { lang, t } = useLang();
  const pct = discountPercent(product.price, product.oldPrice);
  return (
    <div className={`price-tag price-${size}`}>
      <strong className="price-now">
        {formatPrice(product.price, lang)} <span>{SITE.currency[lang]}</span>
      </strong>
      {pct > 0 && (
        <span className="price-old-row">
          <s className="price-old" aria-label={`${t.product.oldPrice}: ${formatPrice(product.oldPrice, lang)} ${SITE.currency[lang]}`}>
            {formatPrice(product.oldPrice, lang)} {SITE.currency[lang]}
          </s>
          <span className="badge-discount" aria-label={`${t.product.discount} ${pct}%`}>
            −{pct}%
          </span>
        </span>
      )}
    </div>
  );
}

export function DiscountBadge({ product }) {
  const pct = discountPercent(product.price, product.oldPrice);
  if (!pct) return null;
  return <span className="badge-discount badge-float">−{pct}%</span>;
}

/** Uzum Market tugmasi — havola bo'lmasa, umuman chiqmaydi */
export function BuyButton({ product, placement, size = '', label }) {
  const { lang, t } = useLang();
  if (!product.uzumUrl) return null;
  return (
    <a
      className={`btn btn-primary btn-buy ${size}`}
      href={buildUzumUrl(product)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackOutbound(product, placement)}
    >
      <Icon name="bag" size={18} />
      <span>{label || t.product.buy}</span>
      <span className="sr-only">
        {' '}
        — {product.name[lang]} {t.product.newTab}
      </span>
    </a>
  );
}
