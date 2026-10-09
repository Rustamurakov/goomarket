import { Link, ROUTES } from '../lib/router.jsx';

// Logotip: "G" harfi ichida ulanish nuqtasi — zaryad/aloqa g'oyasi.
export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id="gm-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8A2BFF" />
          <stop offset="1" stopColor="#5A00D6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#gm-logo)" />
      <path d="M42 22.5A13 13 0 1 0 45 33H33" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <circle cx="45" cy="22" r="3.5" fill="#fff" />
    </svg>
  );
}

export function Logo({ onClick }) {
  return (
    <Link to={ROUTES.home} className="logo" aria-label="GooMarket" onClick={onClick}>
      <LogoMark />
      <span className="logo-word">
        Goo<span>Market</span>
      </span>
    </Link>
  );
}
