import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Cartaz from './Cartaz'
import { diaMes, mesCurto, hora, rotuloDia, situacao } from '../lib/datas'
import { km, textoDistancia, useMinhaPosicao } from '../lib/distancia'

// soHora: a lista já está agrupada por dia, então o card mostra só a hora.
// grande: destaque do próximo evento, ocupa a largura toda com o cartaz em paisagem.
export default function CardEvento({ evento: e, soHora = false, grande = false, className = '', style }) {
  const temImagem = !!e.cartazUrl
  const pos = useMinhaPosicao()
  const dist = textoDistancia(km(pos, e))
  const preco = e.gratuito ? 'Grátis' : e.preco
  const agora = situacao(e)?.tipo === 'agora'
  return (
    <Link to={`/evento/${e.id}`} style={style}
      className={`card-evento group flex overflow-hidden rounded-2xl border border-line bg-surface hover:border-brand/40 ${grande ? 'col-span-2 flex-col sm:flex-row' : 'flex-col'} ${className}`}>
      <div className={`relative overflow-hidden ${grande ? 'aspect-[16/9] sm:aspect-auto sm:w-3/5' : 'aspect-[4/5]'}`}>
        <Cartaz evento={e} comData={!temImagem} marca={grande} largo={grande} className="card-img absolute inset-0 size-full" />
        {temImagem && (
          <div className="absolute left-2 top-2 rounded-lg bg-accent px-2 py-1 text-center leading-none text-on-accent shadow">
            <div className="font-display text-xl">{diaMes(e.inicio)}</div>
            <div className="text-xs font-bold uppercase">{mesCurto(e.inicio)}</div>
          </div>
        )}
        {e.destaque && <span className={`absolute right-2 ${e.gratuito ? 'top-9' : 'top-2'} rounded-full bg-brand px-2 py-0.5 text-xs font-extrabold text-on-brand shadow ring-2 ring-accent`}>★ DESTAQUE</span>}
        {agora && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-[#1a1630]/90 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow"><span className="ao-vivo size-2 rounded-full bg-accent" aria-hidden />Rolando agora</span>}
        {e.gratuito && <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-on-accent shadow">GRÁTIS</span>}
      </div>
      <div className={`flex flex-1 flex-col ${grande ? 'p-4 sm:p-6' : 'p-3'}`}>
        {grande && <p className="text-xs font-bold uppercase tracking-widest text-muted">{agora ? 'Acontecendo agora' : 'Próximo rolê'}</p>}
        <div className={`num font-bold uppercase tracking-wide text-brand-ink ${grande ? 'text-sm' : 'text-xs'}`}>{soHora ? hora(e.inicio) : `${rotuloDia(e.inicio)} · ${hora(e.inicio)}`}</div>
        <h3 className={`mt-0.5 font-display uppercase leading-tight tracking-wide group-hover:text-brand-ink ${grande ? 'text-2xl sm:text-4xl' : 'line-clamp-2 text-lg'} ${temImagem ? '' : 'sr-only'}`}>{e.titulo}</h3>
        <p className="mt-1 flex items-start gap-1 text-xs text-muted">
          <MapPin className="mt-px size-3.5 shrink-0 text-brand-ink" aria-hidden />
          <span className="line-clamp-2">{[e.localNome, e.cidade].filter(Boolean).join(' · ')}</span>
        </p>
        {dist && <p className="mt-1 w-fit rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand-ink">{dist} de você</p>}
        {preco && <p className="num mt-auto pt-1.5 text-sm font-bold">{preco}</p>}
      </div>
    </Link>
  )
}
