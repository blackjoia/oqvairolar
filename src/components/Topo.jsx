import { Link } from 'react-router-dom'
import BotaoTema from './Tema'
import Logo from './Logo'
import { useEffect, useState } from 'react'
import { Plus, UserRound, Trophy, Download } from 'lucide-react'
import { abrirInstalar, appInstalado, podeInstalarDireto, instalarDireto } from './InstalarApp'
import { clique } from '../lib/visitas'
import { useAuth } from '../lib/auth'
import BalaoConta from './BalaoConta'
import { useAmigos } from '../lib/amigos-ctx'
import { RANKING_LIGADO } from '../lib/recursos'

export default function Topo({ children, semDivulgar }) {
  const { usuario } = useAuth()
  const { recebidos, convites } = useAmigos()
  const novidades = recebidos.length + convites.filter((c) => !c.visto).length
  // Celular: botão "Instalar app" no topo (some quando o app já está instalado)
  const [mostrarInstalar, setMostrarInstalar] = useState(false)
  const [chamando, setChamando] = useState(false)
  useEffect(() => {
    const celular = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)
    setMostrarInstalar(celular && !appInstalado())
  }, [])
  const instalar = async () => {
    clique('instalar-topo')
    if (podeInstalarDireto()) { if (await instalarDireto()) setMostrarInstalar(false) } else abrirInstalar()
  }
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/[.97] md:bg-bg/85 md:backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-3">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold focus:text-ink focus:shadow">Pular para o conteúdo</a>
        <Link to="/" aria-label="Início" className="-my-0.5 py-0.5"><Logo className="h-10 w-auto text-ink" /></Link>
        <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Computador e tablet: o ranking é um botão de destaque no topo (no celular ele vira o carrossel da agenda) */}
          {!children && RANKING_LIGADO && <Link to="/ranking" className="hidden h-11 items-center gap-2 rounded-full bg-[#1a1630] px-4 text-sm font-bold text-white shadow-sm ring-2 ring-inset ring-accent/70 hover:bg-[#2a2450] md:inline-flex"><Trophy className="size-4 text-accent" aria-hidden /> Ranking do mês</Link>}
          {mostrarInstalar && <button onClick={instalar} className="inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brand/40 bg-brand/10 px-2.5 text-[13px] font-bold text-brand-ink md:hidden"><Download className="size-4" aria-hidden /> Instalar app</button>}
          {children ?? (!semDivulgar && <Link to="/divulgar" aria-label="Divulgar" className={`btn-accent h-11 text-sm ${mostrarInstalar ? 'px-3 max-md:w-11 max-md:px-0' : 'px-3.5'}`}><Plus className="size-4" /> <span className={mostrarInstalar ? 'max-md:hidden' : ''}>Divulgar</span></Link>)}<span className={mostrarInstalar ? 'max-md:hidden' : ''}><BotaoTema /></span>
          <Link to="/meus-roles" aria-label={usuario ? 'Meus rolês' : 'Entrar'} title={usuario ? 'Meus rolês' : 'Entrar'}
            className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface text-brand-ink hover:bg-surface-2 ${chamando ? 'conta-chamando' : ''}`}>
            {usuario?.foto ? <img src={usuario.foto} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : <UserRound className="size-5" aria-hidden />}
          </Link>
          {novidades > 0 && <span className="pointer-events-none absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-on-accent ring-2 ring-bg" title="Novidades dos amigos">{novidades}<span className="sr-only"> novidades dos amigos</span></span>}
          {!children && <BalaoConta onMostrar={setChamando} />}</div>
      </div>
    </header>
  )
}
