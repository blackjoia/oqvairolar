import { Flame } from 'lucide-react'

// Selo "Bombando": aparece quando o evento está juntando gente rápido (ver src/lib/alta.js).
export default function Bombando({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-[#ff4d1a] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow ${className}`}>
      <Flame className="size-3.5 fill-current" aria-hidden /> Bombando
    </span>
  )
}
