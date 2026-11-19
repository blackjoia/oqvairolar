import { Link } from 'react-router-dom'
import BotaoTema from './Tema'
import Logo from './Logo'
import { Plus, UserRound } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Topo({ children, semDivulgar }) {
  const { usuario } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold focus:text-ink focus:shadow">Pular para o conteúdo</a>
        <Link to="/" aria-label="Início" className="-my-0.5 py-0.5"><Logo className="h-10 w-auto text-ink" /></Link>
        <div className="flex items-center gap-2">{children ?? (!semDivulgar && <Link to="/divulgar" className="btn-accent h-11 px-3.5 text-sm"><Plus className="size-4" /> Divulgar</Link>)}<BotaoTema />
          <Link to="/meus-roles" aria-label={usuario ? 'Meus rolês' : 'Entrar'} title={usuario ? 'Meus rolês' : 'Entrar'}
            className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface text-brand-ink hover:bg-surface-2">
            {usuario?.foto ? <img src={usuario.foto} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : <UserRound className="size-5" aria-hidden />}
          </Link></div>
      </div>
    </header>
  )
}
