import { categoria } from '../lib/constantes'
import { diaMes, mesCurto, diaSemana, hora } from '../lib/datas'

// Cartaz do evento. Sem imagem, monta um cartaz automático com o nome,
// a data e a cor do tipo de evento.
export default function Cartaz({ evento: e, className = '', comData = true }) {
  if (e.cartazUrl) {
    return <img src={e.cartazUrl} alt={`Cartaz: ${e.titulo}`} loading="lazy" className={`object-cover ${className}`} />
  }
  const cat = categoria(e.categoria)
  const { Icone } = cat
  const titulo = (e.titulo || 'Novo evento').toUpperCase()
  const tam = titulo.length > 40 ? 10 : titulo.length > 24 ? 12.5 : titulo.length > 14 ? 15 : 19
  return (
    <div className={`@container relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(150deg, ${cat.cor} 0%, ${cat.fundo} 100%)`, color: cat.tinta }}
      role="img" aria-label={`Cartaz: ${e.titulo}`}>
      <Icone aria-hidden strokeWidth={1.25}
        className="absolute -bottom-[8%] -right-[12%] size-[70%] rotate-[-14deg] opacity-20" />
      <div className="absolute inset-0 flex flex-col justify-between p-[7cqw]">
        <span className="inline-flex w-fit max-w-[62%] items-center gap-[2cqw] rounded-full bg-black/20 px-[3.5cqw] py-[1.2cqw] text-[5cqw] font-bold uppercase tracking-wide">
          <Icone aria-hidden className="size-[5.5cqw] shrink-0" strokeWidth={2.4} /><span className="truncate">{cat.nome}</span>
        </span>
        <p className="line-clamp-4 font-display leading-[.95] break-words" style={{ fontSize: `${tam}cqw` }}>{titulo}</p>
        <div className="flex items-end justify-between gap-[3cqw]">
          {comData && e.inicio ? (
            <span className="rounded-[2.5cqw] bg-accent px-[3cqw] py-[1.5cqw] font-display leading-none text-on-accent">
              <span className="text-[9cqw]">{diaMes(e.inicio)}</span>{' '}
              <span className="text-[5.5cqw] uppercase">{mesCurto(e.inicio)} · {diaSemana(e.inicio)} {hora(e.inicio)}</span>
            </span>
          ) : <span />}
          <span className="font-display text-[5cqw] uppercase opacity-80">oquevairolar</span>
        </div>
      </div>
    </div>
  )
}
