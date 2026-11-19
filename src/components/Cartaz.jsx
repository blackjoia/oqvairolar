import { categoria } from '../lib/constantes'
import { diaMes, mesCurto, diaSemana, hora } from '../lib/datas'

// Cartaz do evento. Sem imagem, monta um cartaz automático com o nome,
// a data e a cor do tipo de evento.
export default function Cartaz({ evento: e, className = '', comData = true, marca = true, largo = false }) {
  if (e.cartazUrl) {
    return <img src={e.cartazUrl} alt={`Cartaz: ${e.titulo}`} loading="lazy" className={`object-cover ${className}`} />
  }
  const cat = categoria(e.categoria)
  const { Icone } = cat
  const titulo = (e.titulo || 'Novo evento').toUpperCase()
  // No formato largo (paisagem) a altura é menor, então o título encolhe um pouco.
  const tam = (titulo.length > 40 ? 10.5 : titulo.length > 24 ? 13.5 : titulo.length > 14 ? 16.5 : 21) * (largo ? 0.62 : 1)
  return (
    <div className={`@container relative overflow-hidden ${className}`}
      style={{ background: cat.cor, color: cat.tinta }}
      role="img" aria-label={`Cartaz: ${e.titulo}`}>
      <Icone aria-hidden strokeWidth={1.25}
        className="absolute -bottom-[10%] -right-[14%] size-[78%] rotate-[-14deg] opacity-[.16]" />
      <div className={`absolute inset-0 flex flex-col justify-between ${largo ? 'p-[4.5cqw]' : 'p-[7cqw]'}`}>
        <span className={`inline-flex w-fit max-w-[74%] items-center gap-[2cqw] rounded-[1.5cqw] bg-black/25 px-[3cqw] py-[1.2cqw] ${largo ? 'text-[max(11px,3.2cqw)]' : 'text-[max(11px,4.6cqw)]'} font-bold uppercase tracking-[.04em]`}>
          <Icone aria-hidden className={`${largo ? 'size-[max(12px,3.6cqw)]' : 'size-[max(12px,5.5cqw)]'} shrink-0`} strokeWidth={2.4} /><span className="truncate">{cat.curto || cat.nome}</span>
        </span>
        <p className="relative line-clamp-4 font-display leading-[.92] tracking-[-.01em] break-words" style={{ fontSize: `${tam}cqw` }}>{titulo}</p>
        <div className="flex items-end justify-between gap-[3cqw]">
          {comData && e.inicio ? (
            <span className="rounded-[2.5cqw] bg-accent px-[3cqw] py-[1.5cqw] font-display leading-none text-on-accent">
              <span className={largo ? 'text-[6cqw]' : 'text-[9cqw]'}>{diaMes(e.inicio)}</span>{' '}
              <span className={`${largo ? 'text-[3.6cqw]' : 'text-[5.5cqw]'} uppercase`}>{mesCurto(e.inicio)} · {diaSemana(e.inicio)} {hora(e.inicio)}</span>
            </span>
          ) : <span />}
          {marca ? <span className={`font-display ${largo ? 'text-[3.4cqw]' : 'text-[5cqw]'} uppercase opacity-80`}>oquevairolar</span> : <span />}
        </div>
      </div>
    </div>
  )
}
