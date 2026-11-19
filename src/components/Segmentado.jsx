import { useLayoutEffect, useRef, useState } from 'react'

// Seletor "um entre vários" com um destaque que desliza até a opção escolhida.
// opcoes: [{ id, nome, curto?, n? }]
export default function Segmentado({ opcoes, valor, onChange, rotulo }) {
  const trilho = useRef(null)
  const [ind, setInd] = useState(null)
  useLayoutEffect(() => {
    const el = trilho.current; if (!el) return
    const medir = () => {
      const b = el.querySelector('[aria-checked="true"]')
      if (b) setInd({ x: b.offsetLeft, w: b.offsetWidth })
    }
    medir()
    const ro = new ResizeObserver(medir); ro.observe(el)
    return () => ro.disconnect()
  }, [valor, opcoes])
  return (
    <div ref={trilho} role="radiogroup" aria-label={rotulo}
      className="relative inline-flex shrink-0 items-center rounded-full bg-surface-2 p-1 ring-1 ring-inset ring-line">
      {ind && (
        <span aria-hidden className="segmento-ind absolute inset-y-1 left-0 rounded-full bg-brand shadow-[0_1px_2px_rgb(26_22_48/.2),0_6px_16px_-6px_var(--brand)]"
          style={{ width: ind.w, transform: `translateX(${ind.x}px)` }} />
      )}
      {opcoes.map((o) => {
        const on = o.id === valor
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => onChange(o.id)}
            onKeyDown={(ev) => {
              const i = opcoes.findIndex((x) => x.id === valor)
              const d = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? -1 : 0
              if (!d) return
              ev.preventDefault()
              const prox = opcoes[(i + d + opcoes.length) % opcoes.length]
              onChange(prox.id)
              requestAnimationFrame(() => trilho.current?.querySelector('[aria-checked="true"]')?.focus())
            }}
            className={`segmento relative z-10 flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ${on ? 'text-on-brand' : 'text-muted hover:text-ink'}`}>
            {o.curto ? <><span className="sm:hidden">{o.curto}</span><span className="hidden sm:inline">{o.nome}</span></> : o.nome}
            {o.n != null && o.n > 0 && (
              <span className={`min-w-5 rounded-full px-1.5 text-[11px] font-bold tabular-nums leading-5 ${on ? 'bg-white/20 text-on-brand' : 'bg-surface text-muted ring-1 ring-inset ring-line'}`}>{o.n}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
