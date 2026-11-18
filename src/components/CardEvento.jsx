import { Link } from 'react-router-dom'
import Cartaz from './Cartaz'
import { diaMes, mesCurto, hora, diaSemana } from '../lib/datas'

export default function CardEvento({ evento: e }) {
  return (
    <Link to={`/evento/${e.id}`}
      className="group flex overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg hover:shadow-brand/10">
      <div className="relative w-28 shrink-0 sm:w-32">
        <Cartaz evento={e} className="absolute inset-0 size-full" />
        <div className="absolute left-2 top-2 rounded-lg bg-accent px-2 py-1 text-center leading-none text-on-accent shadow">
          <div className="font-display text-xl">{diaMes(e.inicio)}</div>
          <div className="text-[10px] font-bold uppercase">{mesCurto(e.inicio)}</div>
        </div>
      </div>
      <div className="min-w-0 flex-1 p-3.5">
        <div className="text-xs font-bold uppercase tracking-wide text-brand">
          {diaSemana(e.inicio)} · {hora(e.inicio)}
        </div>
        <h3 className="mt-0.5 line-clamp-2 font-display text-xl uppercase leading-tight tracking-wide group-hover:text-brand">
          {e.titulo}
        </h3>
        <p className="mt-1 truncate text-sm text-muted">📍 {[e.localNome, e.cidade].filter(Boolean).join(' · ')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(e.generos || []).slice(0, 3).map((g) => (
            <span key={g} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{g}</span>
          ))}
          <span className="ml-auto text-sm font-bold">
            {e.gratuito ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-on-accent">GRÁTIS</span> : e.preco}
          </span>
        </div>
      </div>
    </Link>
  )
}
