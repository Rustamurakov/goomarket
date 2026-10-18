import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { ProductsProvider } from './lib/products-store.jsx';
import { captureUtm } from './lib/analytics.js';
import { initMetaPixel } from './lib/metaPixel.js';
import App from './App.jsx';
import './styles/global.css';
import './styles/product.css';
import './admin/admin.css';

// Instagram reklamasidan kelgan UTM belgilarni saqlab qo'yish
captureUtm();
// Meta Pixel (hostingda META_PIXEL_ID berilgan bo'lsa)
initMetaPixel();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ProductsProvider>
        <App />
      </ProductsProvider>
    </LanguageProvider>
  </StrictMode>,
);
