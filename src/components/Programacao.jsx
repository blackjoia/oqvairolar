import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPublicados, buscarEvento } from '../lib/eventos'
import { rotuloDia, hora, situacao } from '../lib/datas'
import { ChevronRight, Music } from 'lucide-react'

// Festa com vários shows: o evento geral mostra a programação, e cada show tem a página dele (campo "pai").
export function Programacao({ evento }) {
  const [shows, setShows] = useState([])
  useEffect(() => {
    listarPublicados().then((l) => setShows(l.filter((x) => x.pai === evento.id).sort((a, b) => a.inicio - b.inicio))).catch(() => {})
  }, [evento.id])
  if (!shows.length) return null
  const dias = []
  for (const s of shows) {
    const d = rotuloDia(s.inicio)
    if (dias.at(-1)?.d !== d) dias.push({ d, itens: [] })
    dias.at(-1).itens.push(s)
  }
  return (
    <section className="mt-6" aria-labelledby="programacao">
      <h2 id="programacao" className="font-display text-2xl uppercase">Shows da programação</h2>
      <p className="text-sm text-muted">Toque num show para marcar "Eu vou" e fazer check-in nele.</p>
      {dias.map(({ d, itens }) => (
        <div key={d} className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-ink">{d}</p>
          <ul className="mt-1 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {itens.map((s) => (
              <li key={s.id}>
                <Link to={`/evento/${s.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                  <span className="w-12 font-display text-lg tabular-nums">{hora(s.inicio)}</span>
                  <Music className="size-4 shrink-0 text-muted" aria-hidden />
                  <span className="flex-1 font-semibold">{s.titulo}</span>
                  {situacao(s) === 'agora' && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-on-accent">Agora</span>}
                  <ChevronRight className="size-4 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

export function FazParte({ evento }) {
  const [pai, setPai] = useState(null)
  useEffect(() => { if (evento.pai) buscarEvento(evento.pai).then(setPai).catch(() => {}) }, [evento.pai])
  if (!pai) return null
  return (
    <Link to={`/evento/${pai.id}`} className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold hover:border-brand">
      <span className="flex-1">Faz parte da <span className="text-brand-ink">{pai.titulo}</span>. Ver a programação</span><ChevronRight className="size-4 shrink-0" aria-hidden />
    </Link>
  )
}
