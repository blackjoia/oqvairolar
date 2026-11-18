import { Link } from 'react-router-dom'
import BotaoTema from './Tema'

export default function Topo({ children }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-brand font-display text-sm text-accent">OQV</span>
          <span className="font-display text-xl uppercase tracking-wide">O que vai rolar<span className="text-brand">?</span></span>
        </Link>
        <div className="flex items-center gap-2">{children}<BotaoTema /></div>
      </div>
    </header>
  )
}
