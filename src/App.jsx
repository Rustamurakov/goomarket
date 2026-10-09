import { useEffect } from 'react';
import { useLang } from './i18n/LanguageContext.jsx';
import { Link, ROUTES, matchPath, useRoute } from './lib/router.jsx';
import { PREVIEW } from './lib/env.js';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { Icon } from './components/Icons.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import ProductPage from './pages/ProductPage.jsx';
import AdminApp from './admin/AdminApp.jsx';

function NotFound() {
  const { t } = useLang();
  return (
    <section className="page-hero not-found">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="page-title">{t.notFound.title}</h1>
        <Link to={ROUTES.home} className="btn btn-primary">
          {t.notFound.button}
        </Link>
      </div>
    </section>
  );
}

// Ko'rgazma rejimida admin panelga doim ko'rinadigan kirish tugmasi
function PreviewAdminButton() {
  if (!PREVIEW) return null;
  return (
    <Link to={ROUTES.admin} className="preview-admin-btn">
      <Icon name="lock" size={18} />
      <span>Admin panel</span>
    </Link>
  );
}

function PreviewBanner() {
  const { t } = useLang();
  if (!PREVIEW) return null;
  return (
    <div className="preview-banner" role="note">
      <Icon name="info" size={16} />
      <span>{t.preview}</span>
      <Link to={ROUTES.admin}>Admin panel →</Link>
    </div>
  );
}

export default function App() {
  const { t } = useLang();
  const { path, query } = useRoute();

  // Sahifa almashganda yuqoriga qaytish (til almashganda emas)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [path]);

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <>
        <PreviewBanner />
        <AdminApp path={path} query={query} />
      </>
    );
  }

  let page;
  const productMatch = matchPath('/product/:slug', path);
  if (path === ROUTES.home) page = <Home />;
  else if (path === ROUTES.products) page = <Catalog query={query} />;
  else if (path === ROUTES.about) page = <About />;
  else if (path === ROUTES.contact) page = <Contact />;
  else if (productMatch) page = <ProductPage slug={productMatch.slug} />;
  else page = <NotFound />;

  const navPath = productMatch ? ROUTES.products : path;

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t.nav.skip}
      </a>
      <PreviewBanner />
      <Header currentPath={navPath} />
      <main id="main" tabIndex={-1} key={path} className="page-enter">
        {page}
      </main>
      <Footer />
      <PreviewAdminButton />
    </>
  );
}
