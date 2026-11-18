import { Link } from 'react-router-dom'
import BotaoTema from './Tema'
import Logo from './Logo'

export default function Topo({ children }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="Início"><Logo className="h-9 w-auto text-ink" /></Link>
        <div className="flex items-center gap-2">{children}<BotaoTema /></div>
      </div>
    </header>
  )
}
