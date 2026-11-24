import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, ChevronDown, Check, X } from 'lucide-react'
import Logo from './Logo'

// Lista de cidades para escolher. "Todas" mostra o Sudoeste inteiro.
function Lista({ cidades, valor, onEscolher }) {
  const total = cidades.reduce((a, [, n]) => a + n, 0)
  return (
    <ul className="mt-4 grid gap-2">
      {cidades.map(([c, n]) => (
        <li key={c}>
          <button onClick={() => onEscolher(c)} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left font-semibold ${valor === c ? 'border-brand bg-brand/10 text-brand-ink' : 'border-line bg-surface hover:bg-surface-2'}`}>
            <MapPin className="size-5 shrink-0 text-brand-ink" aria-hidden />
            <span className="flex-1">{c}</span>
            <span className="num text-sm font-semibold text-muted">{n} {n === 1 ? 'rolê' : 'rolês'}</span>
            {valor === c && <Check className="size-5 text-brand-ink" aria-hidden />}
          </button>
        </li>
      ))}
      <li>
        <button onClick={() => onEscolher('todas')} className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left font-semibold ${valor === '' ? 'border-brand bg-brand/10 text-brand-ink' : 'border-dashed border-line hover:bg-surface-2'}`}>
          <span className="flex-1">Todas as cidades do Sudoeste</span>
          <span className="num text-sm font-semibold text-muted">{total} rolês</span>
          {valor === '' && <Check className="size-5 text-brand-ink" aria-hidden />}
        </button>
      </li>
    </ul>
  )
}

function Janela({ children, onFechar, rotulo }) {
  useEffect(() => {
    const esc = (x) => { if (x.key === 'Escape' && onFechar) onFechar() }
    addEventListener('keydown', esc); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onFechar])
  return createPortal(
    <div className="conquista-fundo fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label={rotulo}
      onClick={(x) => { if (x.target === x.currentTarget && onFechar) onFechar() }}>
      <div className="conquista-cartao max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-bg p-5 shadow-2xl">{children}</div>
    </div>, document.body)
}

// Primeira vez que abre o app: pergunta a cidade e guarda neste aparelho.
export function PrimeiraCidade({ cidades, onEscolher }) {
  return (
    <Janela rotulo="Escolha sua cidade">
      <Logo className="h-10 w-auto text-ink" />
      <h2 className="mt-4 font-display text-4xl uppercase leading-[.95]">Onde você vai <span className="rounded-lg bg-accent px-1.5 text-on-accent">curtir</span>?</h2>
      <p className="mt-2 text-muted">A agenda abre sempre na sua cidade. Dá para trocar quando quiser, lá em cima.</p>
      <Lista cidades={cidades} valor={null} onEscolher={onEscolher} />
    </Janela>
  )
}

// Botão no topo da agenda: mostra a cidade escolhida e abre a lista para trocar.
export function SeletorCidade({ cidade, cidades, onEscolher }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button onClick={() => setAberto(true)} aria-haspopup="dialog" className="link-toque -my-2 inline-flex max-w-full items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-brand-ink">
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{cidade || 'Sudoeste do Paraná'}</span>
        <span className="ml-1 inline-flex shrink-0 items-center gap-0.5 normal-case tracking-normal text-muted underline decoration-dotted underline-offset-4">Trocar cidade<ChevronDown className="size-3.5" aria-hidden /></span>
      </button>
      {aberto && (
        <Janela rotulo="Trocar de cidade" onFechar={() => setAberto(false)}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl uppercase leading-none">Trocar de cidade</h2>
            <button onClick={() => setAberto(false)} className="grid size-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Fechar"><X className="size-5" aria-hidden /></button>
          </div>
          <Lista cidades={cidades} valor={cidade} onEscolher={(c) => { setAberto(false); onEscolher(c) }} />
        </Janela>
      )}
    </>
  )
}
