import { useLang } from '../i18n/LanguageContext.jsx';
import { Link, ROUTES } from '../lib/router.jsx';
import { Icon } from './Icons.jsx';
import { keepNumbers, formatPrice } from '../lib/useSeo.js';
import { formatRating } from '../../shared/product-schema.js';
import { BuyButton, DiscountBadge, PriceTag, ProductImage } from './ProductBits.jsx';

export function ProductCard({ product, placement = 'catalog' }) {
  const { lang, t } = useLang();
  const name = product.name[lang] || product.name.uz;
  const to = ROUTES.product(product.slug);
  const titleId = `title-${product.id}-${placement}`;

  return (
    <article id={`product-${product.slug}`} className="product-card" aria-labelledby={titleId}>
      <Link to={to} className="product-media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} alt="" />
        <span className="product-cat">{t.categories[product.category]}</span>
        <DiscountBadge product={product} />
      </Link>

      <div className="product-body">
        <h3 id={titleId} className="product-title">
          <Link to={to}>{keepNumbers(name)}</Link>
        </h3>
        {(product.rating > 0 || product.soldCount > 0) && (
          <p className="product-proof">
            {product.rating > 0 && (
              <>
                <span className="stars" aria-hidden="true">
                  <span className="stars-base">★★★★★</span>
                  <span className="stars-fill" style={{ width: `${(product.rating / 50) * 100}%` }}>
                    ★★★★★
                  </span>
                </span>
                <b>{formatRating(product.rating)}</b>
              </>
            )}
            {product.rating > 0 && product.soldCount > 0 && <span aria-hidden="true">·</span>}
            {product.soldCount > 0 && (
              <span>
                <b>{formatPrice(product.soldCount, lang)}+</b> {t.product.sold}
              </span>
            )}
          </p>
        )}
        {(product.tagline?.[lang] || product.desc[lang]) && <p className="product-desc">{product.tagline?.[lang] || product.desc[lang]}</p>}

        <div className="product-foot">
          <PriceTag product={product} />
          {product.uzumUrl ? (
            <BuyButton product={product} placement={placement} />
          ) : (
            <Link to={to} className="btn btn-ghost btn-buy">
              {t.product.more} <Icon name="arrow" size={18} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card is-skeleton" aria-hidden="true">
      <div className="product-media" />
      <div className="product-body">
        <span className="sk sk-line" />
        <span className="sk sk-line short" />
        <span className="sk sk-price" />
        <span className="sk sk-btn" />
      </div>
    </div>
  );
}
