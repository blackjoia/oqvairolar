import { categoria } from '../lib/constantes'
import { diaMes, mesCurto, diaSemana, hora } from '../lib/datas'
import { tamanho, srcSet, TAM_CARD, TAM_LARGO } from '../lib/imagem'

// Cartaz do evento. Sem imagem, monta um cartaz automático com o nome,
// a data e a cor do tipo de evento.
// sizes: quanto o cartaz ocupa na tela (escolhe o arquivo certo). prioridade: está no topo da tela, baixa primeiro.
export default function Cartaz({ evento: e, className = '', comData = true, marca = true, largo = false, sizes, prioridade = false }) {
  if (e.cartazUrl) {
    return <img src={tamanho(e.cartazUrl, 720)} srcSet={srcSet(e.cartazUrl)} sizes={sizes || (largo ? TAM_LARGO : TAM_CARD)}
      alt={`Cartaz: ${e.titulo}`} loading={prioridade ? 'eager' : 'lazy'} fetchPriority={prioridade ? 'high' : undefined} decoding="async"
      className={`object-cover ${className}`} />
  }
  const cat = categoria(e.categoria)
  const { Icone } = cat
  const titulo = (e.titulo || 'Novo evento').toUpperCase()
  // No formato largo (paisagem) a altura é menor, então o título encolhe um pouco.
  const tam = titulo.length > 40 ? 10.5 : titulo.length > 24 ? 13.5 : titulo.length > 14 ? 16.5 : 21
  // Largo (paisagem, card grande): a altura é que limita, então tudo é medido pela altura (cqh) e o nome
  // usa no máximo 2 linhas. Antes o nome crescia pela largura e ficava cortado embaixo pela etiqueta da data.
  const fonte = largo ? `min(${tam * 0.62}cqw, ${titulo.length > 24 ? 14 : 17}cqh)` : `min(${tam}cqw, 15cqh)`
  return (
    <div className={`relative overflow-hidden ${className}`}
      style={{ background: cat.cor, color: cat.tinta, containerType: 'size' }}
      role="img" aria-label={`Cartaz: ${e.titulo}`}>
      <Icone aria-hidden strokeWidth={1.25}
        className="absolute -bottom-[10%] -right-[14%] size-[78%] rotate-[-14deg] opacity-[.16]" />
      <div className={`absolute inset-0 flex flex-col justify-between ${largo ? 'gap-[3cqh] p-[7cqh]' : 'gap-[2cqw] p-[7cqw]'}`}>
        <span className={`inline-flex w-fit max-w-[74%] shrink-0 items-center rounded-[1.5cqw] bg-black/25 font-bold uppercase tracking-[.04em] ${largo ? 'gap-[2cqh] px-[4cqh] py-[1.6cqh] text-[max(11px,7cqh)]' : 'gap-[2cqw] px-[3cqw] py-[1.2cqw] text-[max(11px,4.6cqw)]'}`}>
          <Icone aria-hidden className={`${largo ? 'size-[max(12px,8cqh)]' : 'size-[max(12px,5.5cqw)]'} shrink-0`} strokeWidth={2.4} /><span className="truncate">{cat.curto || cat.nome}</span>
        </span>
        <p className={`relative min-h-0 font-display leading-[.92] tracking-[-.01em] break-words ${largo ? 'line-clamp-2' : 'line-clamp-4'}`} style={{ fontSize: fonte }}>{titulo}</p>
        <div className="flex shrink-0 items-end justify-between gap-[3cqw]">
          {comData && e.inicio ? (
            <span className={`rounded-[2.5cqw] bg-accent font-display leading-none text-on-accent ${largo ? 'px-[4cqh] py-[2cqh]' : 'px-[3cqw] py-[1.5cqw]'}`}>
              <span className={largo ? 'text-[11cqh]' : 'text-[9cqw]'}>{diaMes(e.inicio)}</span>{' '}
              <span className={`${largo ? 'text-[6.5cqh]' : 'text-[5.5cqw]'} uppercase`}>{mesCurto(e.inicio)} · {diaSemana(e.inicio)}{e.semHora ? '' : ` ${hora(e.inicio)}`}</span>
            </span>
          ) : <span />}
          {marca ? <span className={`font-display ${largo ? 'text-[6.5cqh]' : 'text-[5cqw]'} uppercase opacity-80`}>oquevairolar</span> : <span />}
        </div>
      </div>
    </div>
  )
}
