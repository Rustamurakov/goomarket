import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';

// Ommaviy sayt uchun mahsulotlar manbai: serverdan faqat FAOL mahsulotlar keladi.
// Admin paneldagi o'zgarishlardan keyin va sahifaga qaytilganda yangilanadi.

const ProductsContext = createContext(null);
const REFRESH_AFTER_MS = 30 * 1000;
const subscribers = new Set();

/** Admin paneldagi saqlashdan keyin chaqiriladi — ommaviy ro'yxat qayta yuklanadi */
export function invalidateProducts() {
  subscribers.forEach((fn) => fn());
}

export function ProductsProvider({ children }) {
  const [state, setState] = useState({ products: [], status: 'loading', error: null });
  const loadedAt = useRef(0);
  const inFlight = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (inFlight.current) return inFlight.current;
    if (!silent) setState((s) => ({ ...s, status: s.products.length ? 'ready' : 'loading', error: null }));
    inFlight.current = api('/api/products')
      .then((data) => {
        loadedAt.current = Date.now();
        setState({ products: data.products || [], status: 'ready', error: null });
      })
      .catch((err) => {
        setState((s) => (s.products.length ? s : { products: [], status: 'error', error: err.message }));
      })
      .finally(() => {
        inFlight.current = null;
      });
    return inFlight.current;
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load({ silent: true });
    subscribers.add(refresh);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - loadedAt.current > REFRESH_AFTER_MS) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      subscribers.delete(refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const value = useMemo(() => ({ ...state, reload: load }), [state, load]);
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider');
  return ctx;
}
