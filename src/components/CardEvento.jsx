import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Cartaz from './Cartaz'
import { diaMes, mesCurto, hora, rotuloDia } from '../lib/datas'
import { km, textoDistancia, useMinhaPosicao } from '../lib/distancia'

export default function CardEvento({ evento: e }) {
  const temImagem = !!e.cartazUrl
  const pos = useMinhaPosicao()
  const dist = textoDistancia(km(pos, e))
  return (
    <Link to={`/evento/${e.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg hover:shadow-brand/15">
      <div className="relative aspect-[4/5]">
        <Cartaz evento={e} comData={!temImagem} className="absolute inset-0 size-full" />
        {temImagem && (
          <div className="absolute left-2 top-2 rounded-lg bg-accent px-2 py-1 text-center leading-none text-on-accent shadow">
            <div className="font-display text-xl">{diaMes(e.inicio)}</div>
            <div className="text-[10px] font-bold uppercase">{mesCurto(e.inicio)}</div>
          </div>
        )}
        {e.destaque && <span className={`absolute right-2 ${e.gratuito ? "top-9" : "top-2"} rounded-full bg-brand px-2 py-0.5 text-[11px] font-extrabold text-on-brand shadow ring-2 ring-accent`}>★ DESTAQUE</span>}
        {e.gratuito && <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-on-accent shadow">GRÁTIS</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="text-[11px] font-bold uppercase tracking-wide text-brand">{rotuloDia(e.inicio)} · {hora(e.inicio)}</div>
        <h3 className={`mt-0.5 line-clamp-2 font-display text-lg uppercase leading-tight tracking-wide group-hover:text-brand ${temImagem ? '' : 'sr-only'}`}>{e.titulo}</h3>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
          <MapPin className="size-3.5 shrink-0 text-brand" aria-hidden />
          <span className="truncate">{[e.localNome, e.cidade].filter(Boolean).join(' · ')}</span>
        </p>
        {dist && <p className="mt-1 w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">{dist} de você</p>}
        {!e.gratuito && e.preco && <p className="mt-auto pt-1.5 text-sm font-bold">{e.preco}</p>}
      </div>
    </Link>
  )
}
