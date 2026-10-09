import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Link, ROUTES, matchPath, navigate } from '../lib/router.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { Icon } from '../components/Icons.jsx';
import { ToastProvider, Spinner, SiteLink } from './ui.jsx';
import Login from './Login.jsx';
import Setup from './Setup.jsx';
import Dashboard from './Dashboard.jsx';
import ProductList from './ProductList.jsx';
import ProductForm from './ProductForm.jsx';

const NAV = [
  { to: ROUTES.admin, label: 'Boshqaruv paneli', icon: 'dashboard', match: (p) => p === '/admin' },
  { to: ROUTES.adminProducts, label: 'Mahsulotlar', icon: 'list', match: (p) => p === '/admin/products' || /\/edit$/.test(p) },
  { to: ROUTES.adminNew, label: 'Yangi mahsulot', icon: 'plus', match: (p) => p === '/admin/products/new' },
];

function Shell({ admin, path, onLogout, children }) {
  return (
    <div className="admin">
      <aside className="a-sidebar">
        <Link to={ROUTES.admin} className="a-brand">
          <LogoMark size={30} />
          <span>
            GooMarket <small>Admin</small>
          </span>
        </Link>
        <nav className="a-nav" aria-label="Admin menyu">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`a-nav-link${n.match(path) ? ' is-active' : ''}`}
              aria-current={n.match(path) ? 'page' : undefined}
            >
              <Icon name={n.icon} size={20} />
              <span>{n.label}</span>
            </Link>
          ))}
          <SiteLink className="a-nav-link a-nav-site" to={ROUTES.home}>
            <Icon name="globe" size={20} />
            <span>Saytni ko‘rish</span>
          </SiteLink>
        </nav>
        <div className="a-user">
          <span className="a-avatar" aria-hidden="true">
            {admin.username.slice(0, 1).toUpperCase()}
          </span>
          <span className="a-user-name">{admin.username}</span>
          <button type="button" className="a-icon-btn" onClick={onLogout} aria-label="Chiqish" title="Chiqish">
            <Icon name="logout" size={20} />
          </button>
        </div>
      </aside>
      <main className="a-main" id="main">
        {children}
      </main>
    </div>
  );
}

export default function AdminApp({ path, query }) {
  const [session, setSession] = useState({ status: 'checking', admin: null });

  const check = useCallback(async () => {
    try {
      const { admin } = await api('/api/admin/session');
      setSession({ status: 'in', admin });
    } catch {
      setSession({ status: 'out', admin: null });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    document.title = 'Admin — GooMarket';
    let meta = document.head.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    return () => meta.remove();
  }, []);

  const publicRoute = path === ROUTES.adminLogin || path === ROUTES.adminSetup;

  // Kirmagan foydalanuvchi himoyalangan sahifaga kelsa — login sahifasiga
  useEffect(() => {
    if (session.status === 'out' && !publicRoute) {
      navigate(`${ROUTES.adminLogin}?next=${encodeURIComponent(path)}`, { replace: true, force: true });
    }
    if (session.status === 'in' && publicRoute) navigate(ROUTES.admin, { replace: true, force: true });
  }, [session.status, publicRoute, path]);

  const onLoggedIn = (admin) => {
    setSession({ status: 'in', admin });
    const next = query.get('next');
    navigate(next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : ROUTES.admin, { replace: true, force: true });
  };

  const logout = async () => {
    try {
      await api('/api/admin/logout', { method: 'POST' });
    } catch {}
    setSession({ status: 'out', admin: null });
    navigate(ROUTES.adminLogin, { replace: true, force: true });
  };

  // Server sessiya tugaganini aytsa (401), qayta kirishga yo'naltiramiz
  const onUnauthorized = useCallback(() => setSession({ status: 'out', admin: null }), []);

  if (session.status === 'checking') {
    return (
      <div className="a-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (path === ROUTES.adminSetup) return <ToastProvider><Setup query={query} onDone={onLoggedIn} /></ToastProvider>;
  if (session.status !== 'in') return <ToastProvider><Login onLoggedIn={onLoggedIn} /></ToastProvider>;

  let page;
  const edit = matchPath('/admin/products/:id/edit', path);
  if (path === ROUTES.admin) page = <Dashboard onUnauthorized={onUnauthorized} />;
  else if (path === ROUTES.adminProducts) page = <ProductList query={query} onUnauthorized={onUnauthorized} />;
  else if (path === ROUTES.adminNew) page = <ProductForm key="new" onUnauthorized={onUnauthorized} />;
  else if (edit) page = <ProductForm key={edit.id} id={edit.id} onUnauthorized={onUnauthorized} />;
  else
    page = (
      <div className="a-page">
        <h1 className="a-title">Sahifa topilmadi</h1>
        <Link to={ROUTES.admin} className="btn btn-primary">
          Boshqaruv paneliga
        </Link>
      </div>
    );

  return (
    <ToastProvider>
      <Shell admin={session.admin} path={path} onLogout={logout}>
        {page}
      </Shell>
    </ToastProvider>
  );
}
