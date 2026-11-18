// Logo: selo OQ (Q girado em limão) + "VAI ROLAR?"
export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 360 130" className={className} role="img" aria-label="O Que Vai Rolar?">
      <rect x="6" y="10" width="110" height="110" rx="24" fill="#6d28ff" />
      <text x="38" y="94" textAnchor="middle" fontFamily="Anton" fontSize="68" fill="#fff">O</text>
      <text x="80" y="94" textAnchor="middle" fontFamily="Anton" fontSize="68" fill="#c6ff00" transform="rotate(-18 80 66)">Q</text>
      <text x="134" y="62" fontFamily="Anton" fontSize="44" fill="currentColor">VAI</text>
      <text x="134" y="114" fontFamily="Anton" fontSize="56" fill="currentColor">ROLAR<tspan fill="var(--logo-q, #c6ff00)">?</tspan></text>
    </svg>
  )
}
