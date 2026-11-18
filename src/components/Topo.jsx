import { Link } from 'react-router-dom'
import BotaoTema from './Tema'
import Logo from './Logo'
import { Plus } from 'lucide-react'

export default function Topo({ children, semDivulgar }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" aria-label="Início"><Logo className="h-9 w-auto text-ink" /></Link>
        <div className="flex items-center gap-2">{children ?? (!semDivulgar && <Link to="/divulgar" className="btn-accent px-3 py-2 text-sm"><Plus className="size-4" /> Divulgar</Link>)}<BotaoTema /></div>
      </div>
    </header>
  )
}
