// Logo: OQV com o Q girado em limão + "vai rolar?"
export default function Logo({ className = '' }) {
  return (
    <svg viewBox="0 0 300 100" className={className} role="img" aria-label="O Que Vai Rolar?">
      <text x="0" y="88" fontFamily="Anton" fontSize="96" fill="currentColor">O</text>
      <text x="84" y="88" textAnchor="middle" fontFamily="Anton" fontSize="96" fill="var(--logo-q, #c6ff00)" transform="rotate(-22 84 52)">Q</text>
      <text x="118" y="88" fontFamily="Anton" fontSize="96" fill="currentColor">V</text>
      <text x="184" y="44" fontFamily="Anton" fontSize="32" fill="currentColor">VAI</text>
      <text x="184" y="86" fontFamily="Anton" fontSize="40" fill="currentColor">ROLAR<tspan fill="var(--logo-q, #c6ff00)">?</tspan></text>
    </svg>
  )
}
