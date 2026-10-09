import { ProductArt } from './ProductArt.jsx';

// Bosh sahifadagi aksessuarlar kompozitsiyasi: smartfon markazda,
// atrofida quloqchinlar, g'ilof, adapter, kabel va powerbank.
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 600 600" role="img" aria-label="Smartfon va mobil aksessuarlar">
      <defs>
        <radialGradient id="hero-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#7000FF" stopOpacity=".55" />
          <stop offset=".5" stopColor="#7000FF" stopOpacity=".12" />
          <stop offset="1" stopColor="#7000FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-phone" x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stopColor="#3B3B46" />
          <stop offset="1" stopColor="#101015" />
        </linearGradient>
        <linearGradient id="hero-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A0A66" />
          <stop offset=".55" stopColor="#12061F" />
          <stop offset="1" stopColor="#07070A" />
        </linearGradient>
        <radialGradient id="hero-floor" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".8" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="300" cy="290" r="290" fill="url(#hero-glow)" />
      <circle cx="300" cy="290" r="215" fill="none" stroke="rgba(255,255,255,.06)" />
      <circle cx="300" cy="290" r="150" fill="none" stroke="rgba(255,255,255,.05)" />

      {/* Orqa qatordagi powerbank va g'ilof */}
      <g className="float float-b">
        <ProductArt art="powerbank" tone="dark" bare x="352" y="92" width="210" height="210" />
      </g>
      <g className="float float-c">
        <ProductArt art="case" tone="violet" bare x="44" y="70" width="210" height="210" />
      </g>

      {/* Smartfon */}
      <g className="float float-a">
        <ellipse cx="300" cy="532" rx="120" ry="14" fill="url(#hero-floor)" />
        <rect x="212" y="110" width="176" height="400" rx="40" fill="url(#hero-phone)" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
        <rect x="222" y="120" width="156" height="380" rx="32" fill="url(#hero-screen)" />
        <rect x="272" y="132" width="56" height="16" rx="8" fill="#000" />
        <g transform="translate(272 254)">
          <rect width="56" height="56" rx="16" fill="#7000FF" />
          <path d="M37 19.5A11.5 11.5 0 1 0 39.5 29H29" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          <circle cx="39.5" cy="19" r="3" fill="#fff" />
        </g>
        <rect x="252" y="330" width="96" height="8" rx="4" fill="rgba(255,255,255,.75)" />
        <rect x="266" y="346" width="68" height="6" rx="3" fill="rgba(255,255,255,.3)" />
        <rect x="246" y="430" width="108" height="34" rx="17" fill="#7000FF" />
        <rect x="270" y="444" width="60" height="6" rx="3" fill="rgba(255,255,255,.85)" />
        <path d="M226 130 L330 124 L232 330 Z" fill="#fff" opacity=".05" />
      </g>

      {/* Old qator: quloqchinlar, adapter, kabel */}
      <g className="float float-c">
        <ProductArt art="earbuds" tone="light" bare x="20" y="300" width="240" height="240" />
      </g>
      <g className="float float-b">
        <ProductArt art="charger" tone="light" bare x="380" y="330" width="190" height="190" />
      </g>
      <g className="float float-a">
        <ProductArt art="cable" tone="violet" bare x="410" y="440" width="150" height="150" />
      </g>
    </svg>
  );
}
