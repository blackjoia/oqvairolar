import { useState } from 'react'

export default function BotaoTema() {
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains('dark'))
  const alternar = () => {
    const novo = !escuro
    document.documentElement.classList.toggle('dark', novo)
    try { localStorage.setItem('tema', novo ? 'escuro' : 'claro') } catch {}
    setEscuro(novo)
  }
  return (
    <button onClick={alternar} aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      className="grid size-10 place-items-center rounded-full border border-line bg-surface text-lg hover:bg-surface-2">
      {escuro ? '☀️' : '🌙'}
    </button>
  )
}
