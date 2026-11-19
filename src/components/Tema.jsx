import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function BotaoTema() {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains('dark'))
  const alternar = () => {
    const novo = !escuro
    document.documentElement.classList.toggle('dark', novo)
    try { localStorage.setItem('tema', novo ? 'escuro' : 'claro') } catch {}
    window.dispatchEvent(new Event('tema'))
    setEscuro(novo)
  }
  return (
    <button onClick={alternar} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      className="grid size-11 place-items-center rounded-full border border-line bg-surface text-ink hover:bg-surface-2">
      {escuro ? <Sun className="size-5 text-accent" /> : <Moon className="size-5 text-brand-ink" />}
    </button>
  )
}
