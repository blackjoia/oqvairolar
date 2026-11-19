import { LayoutGrid } from 'lucide-react'
import { CATEGORIAS } from '../lib/constantes'

// Categorias como abas com ícone (estilo app): ícone num quadrado com a cor da categoria,
// nome embaixo e um traço sob a escolhida.
export default function AbasCategoria({ valor, onChange, contagem = {}, total }) {
  const itens = [{ id: '', nome: 'Todas', Icone: LayoutGrid, cor: 'var(--brand)' }, ...CATEGORIAS]
  return itens.map((c) => {
    const on = (valor || '') === c.id
    const n = c.id ? contagem[c.id] || 0 : total
    return (
      <button key={c.id || 'todas'} type="button" onClick={() => onChange(on && c.id ? '' : c.id)} aria-pressed={on}
        className={`aba-cat group relative flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 rounded-xl px-1 pb-2 pt-1.5 ${!on && c.id && !n ? 'opacity-50' : ''}`}>
        <span className="aba-cat-icone grid size-11 place-items-center rounded-2xl"
          style={on
            ? { background: c.cor, color: '#fff', boxShadow: `0 6px 16px -6px ${c.cor}` }
            : { background: `color-mix(in oklab, ${c.cor} 13%, transparent)`, color: c.cor }}>
          <c.Icone className="size-[22px]" strokeWidth={2} aria-hidden />
        </span>
        <span className={`max-w-full truncate text-xs leading-tight ${on ? 'font-bold text-ink' : 'font-medium text-muted group-hover:text-ink'}`}>
          {c.nome.replace(' e corrida', '').replace(' e teatro', '')}
        </span>
        {n > 0 && <span className="absolute right-2 top-0.5 min-w-[18px] rounded-full bg-surface px-1 text-center text-xs font-bold leading-[18px] tabular-nums text-muted ring-1 ring-line">{n}</span>}
        <span aria-hidden className={`absolute inset-x-5 bottom-0 h-[3px] rounded-full transition-transform duration-200 ${on ? 'scale-x-100' : 'scale-x-0'}`} style={{ background: c.cor }} />
      </button>
    )
  })
}
