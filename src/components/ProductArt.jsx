import { useId } from 'react';

// =====================================================================
//  Mahsulot vizuallari (vektor). Haqiqiy foto bo'lmaguncha ishlatiladi:
//  yengil (bir necha KB), har qanday ekranda tiniq va tez yuklanadi.
//  Haqiqiy rasm qo'shilsa (product.image), ProductCard uni ko'rsatadi.
// =====================================================================

const TONES = {
  light: { a: '#F7F7FA', b: '#BDBDC8', edge: 'rgba(255,255,255,.9)', detail: '#2A2A33', accent: '#E8E8EE', soft: '#9C9CA8' },
  dark: { a: '#4A4A55', b: '#141419', edge: 'rgba(255,255,255,.28)', detail: '#070709', accent: '#5C5C68', soft: '#2B2B33' },
  violet: { a: '#A56BFF', b: '#4600B5', edge: 'rgba(230,210,255,.75)', detail: '#22005A', accent: '#C8A6FF', soft: '#6B1FE0' },
  clear: { a: 'rgba(255,255,255,.30)', b: 'rgba(255,255,255,.06)', edge: 'rgba(255,255,255,.75)', detail: 'rgba(10,10,14,.55)', accent: 'rgba(255,255,255,.45)', soft: 'rgba(255,255,255,.18)' },
};

function useIds() {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  return { body: `b${raw}`, metal: `m${raw}`, glow: `g${raw}`, sheen: `s${raw}`, floor: `f${raw}` };
}

function Defs({ ids, c }) {
  return (
    <defs>
      <linearGradient id={ids.body} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stopColor={c.a} />
        <stop offset="1" stopColor={c.b} />
      </linearGradient>
      <linearGradient id={ids.metal} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8D8D98" />
        <stop offset=".45" stopColor="#F2F2F6" />
        <stop offset="1" stopColor="#7B7B86" />
      </linearGradient>
      <radialGradient id={ids.glow} cx=".5" cy=".46" r=".55">
        <stop offset="0" stopColor="#7000FF" stopOpacity=".38" />
        <stop offset=".55" stopColor="#7000FF" stopOpacity=".08" />
        <stop offset="1" stopColor="#7000FF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".55" />
        <stop offset=".35" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={ids.floor} cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#000" stopOpacity=".75" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Earbuds({ ids, c }) {
  const bud = (
    <g>
      <rect x="-11" y="-6" width="22" height="88" rx="11" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.2" />
      <ellipse cx="-4" cy="-14" rx="33" ry="29" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.2" />
      <ellipse cx="-20" cy="-18" rx="11" ry="13" fill={c.detail} opacity=".85" />
      <rect x="-5" y="70" width="10" height="9" rx="3" fill={`url(#${ids.metal})`} />
      <ellipse cx="6" cy="-26" rx="16" ry="7" fill={`url(#${ids.sheen})`} />
    </g>
  );
  return (
    <g>
      <ellipse cx="200" cy="338" rx="120" ry="14" fill={`url(#${ids.floor})`} />
      <rect x="112" y="210" width="176" height="122" rx="58" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.4" />
      <path d="M118 248 H282" stroke={c.detail} strokeOpacity=".35" strokeWidth="2" />
      <rect x="124" y="216" width="152" height="28" rx="14" fill={`url(#${ids.sheen})`} />
      <circle cx="200" cy="276" r="3.5" fill="#B788FF" />
      <g transform="translate(150 118) rotate(-14)">{bud}</g>
      <g transform="translate(252 112) rotate(16) scale(-1 1)">{bud}</g>
    </g>
  );
}

function PhoneCase({ ids, c }) {
  return (
    <g>
      <ellipse cx="205" cy="352" rx="90" ry="12" fill={`url(#${ids.floor})`} />
      <g transform="rotate(-6 210 205)">
        <rect x="136" y="58" width="150" height="292" rx="36" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.5" />
        <rect x="146" y="68" width="130" height="272" rx="28" fill="none" stroke={c.edge} strokeOpacity=".25" />
        <rect x="286" y="122" width="4" height="40" rx="2" fill={c.accent} />
        <rect x="132" y="112" width="4" height="26" rx="2" fill={c.accent} />
        <rect x="154" y="78" width="70" height="70" rx="20" fill={c.soft} stroke={c.edge} strokeOpacity=".6" />
        {[[173, 97], [205, 97], [173, 129]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <circle cx={x} cy={y} r="12" fill="#0A0A0E" stroke={c.accent} strokeWidth="2" />
            <circle cx={x - 3} cy={y - 3} r="3" fill="#fff" opacity=".35" />
          </g>
        ))}
        <circle cx="205" cy="129" r="5" fill="#F3E9FF" opacity=".8" />
        <circle cx="211" cy="250" r="16" fill="none" stroke={c.edge} strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M150 70 L250 70 L170 220 Z" fill={`url(#${ids.sheen})`} opacity=".7" />
      </g>
    </g>
  );
}

function Charger({ ids, c }) {
  return (
    <g>
      <ellipse cx="200" cy="330" rx="100" ry="13" fill={`url(#${ids.floor})`} />
      <rect x="171" y="96" width="15" height="70" rx="4" fill={`url(#${ids.metal})`} />
      <rect x="214" y="96" width="15" height="70" rx="4" fill={`url(#${ids.metal})`} />
      <path d="M134 168 H266 L278 182 V300 a22 22 0 0 1 -22 22 H144 a22 22 0 0 1 -22 -22 V182 Z" fill={c.soft} />
      <rect x="122" y="160" width="156" height="156" rx="32" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.5" />
      <rect x="130" y="166" width="140" height="44" rx="22" fill={`url(#${ids.sheen})`} />
      <rect x="174" y="264" width="52" height="16" rx="8" fill={c.detail} />
      <rect x="182" y="270" width="36" height="4" rx="2" fill={`url(#${ids.metal})`} opacity=".8" />
      <path d="M204 212 l-12 22 h14 l-10 20" fill="none" stroke={c.detail} strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Connector({ ids, c, x, y, rot = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-9" y="-58" width="18" height="24" rx="6" fill={`url(#${ids.metal})`} />
      <rect x="-5" y="-54" width="10" height="5" rx="2" fill="#2A2A33" opacity=".6" />
      <rect x="-16" y="-36" width="32" height="58" rx="11" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.3" />
      <rect x="-10" y="-30" width="9" height="40" rx="4.5" fill="#fff" opacity=".22" />
    </g>
  );
}

function Cable({ ids, c }) {
  const stroke = { fill: 'none', stroke: `url(#${ids.body})`, strokeWidth: 11, strokeLinecap: 'round' };
  return (
    <g>
      <ellipse cx="205" cy="335" rx="125" ry="13" fill={`url(#${ids.floor})`} />
      <ellipse cx="205" cy="262" rx="112" ry="58" {...stroke} />
      <ellipse cx="208" cy="256" rx="96" ry="47" {...stroke} />
      <ellipse cx="211" cy="250" rx="80" ry="37" {...stroke} />
      <ellipse cx="205" cy="262" rx="112" ry="58" fill="none" stroke={c.edge} strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M131 250 C 120 200, 132 160, 124 130" {...stroke} />
      <path d="M317 262 C 330 230, 300 190, 300 150" {...stroke} />
      <Connector ids={ids} c={c} x={124} y={118} rot={-8} />
      <Connector ids={ids} c={c} x={300} y={138} rot={10} />
    </g>
  );
}

function Powerbank({ ids, c }) {
  return (
    <g>
      <ellipse cx="205" cy="350" rx="100" ry="13" fill={`url(#${ids.floor})`} />
      <g transform="rotate(8 200 210)">
        <rect x="134" y="74" width="162" height="270" rx="40" fill={c.soft} />
        <rect x="120" y="66" width="162" height="270" rx="40" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.5" />
        <rect x="181" y="72" width="40" height="8" rx="4" fill={c.detail} />
        <path d="M134 82 L230 82 L150 250 Z" fill={`url(#${ids.sheen})`} opacity=".6" />
        <path d="M206 168 l-16 32 h20 l-14 30" fill="none" stroke={c.detail} strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={176 + i * 16} cy="300" r="4" fill={i < 3 ? '#B788FF' : c.detail} opacity={i < 3 ? 1 : 0.5} />
        ))}
      </g>
    </g>
  );
}

function Holder({ ids, c }) {
  return (
    <g>
      <ellipse cx="200" cy="345" rx="95" ry="12" fill={`url(#${ids.floor})`} />
      <rect x="182" y="262" width="36" height="62" rx="12" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.2" />
      <rect x="170" y="316" width="16" height="20" rx="5" fill={`url(#${ids.metal})`} />
      <rect x="214" y="316" width="16" height="20" rx="5" fill={`url(#${ids.metal})`} />
      <circle cx="200" cy="180" r="100" fill={`url(#${ids.body})`} stroke={c.edge} strokeWidth="1.5" />
      <circle cx="200" cy="180" r="72" fill="none" stroke="#9B5CFF" strokeWidth="6" opacity=".9" />
      <circle cx="200" cy="180" r="72" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1" />
      <circle cx="200" cy="180" r="30" fill={c.soft} stroke={c.edge} strokeOpacity=".4" />
      <path d="M120 120 A100 100 0 0 1 250 92" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Glass({ ids, c }) {
  return (
    <g>
      <ellipse cx="205" cy="350" rx="95" ry="11" fill={`url(#${ids.floor})`} />
      <g transform="rotate(-10 205 205)">
        <rect x="142" y="58" width="140" height="290" rx="32" fill="rgba(160,120,255,.10)" stroke="rgba(255,255,255,.75)" strokeWidth="2" />
        <rect x="150" y="66" width="124" height="274" rx="26" fill="none" stroke="rgba(255,255,255,.2)" />
        <rect x="192" y="76" width="40" height="12" rx="6" fill="rgba(0,0,0,.45)" />
        <path d="M150 140 L282 80 L282 120 L150 220 Z" fill="#fff" opacity=".18" />
        <path d="M150 250 L282 170 L282 186 L150 268 Z" fill="#fff" opacity=".1" />
      </g>
    </g>
  );
}

const ART = { earbuds: Earbuds, case: PhoneCase, charger: Charger, cable: Cable, powerbank: Powerbank, holder: Holder, glass: Glass };

export function ProductArt({ art = 'earbuds', tone = 'light', bare = false, label, ...svgProps }) {
  const ids = useIds();
  const c = TONES[tone] || TONES.light;
  const Shape = ART[art] || Earbuds;
  return (
    <svg viewBox="0 0 400 400" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} {...svgProps}>
      <Defs ids={ids} c={c} />
      {!bare && <rect width="400" height="400" fill={`url(#${ids.glow})`} />}
      <Shape ids={ids} c={c} />
    </svg>
  );
}
