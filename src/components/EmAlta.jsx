import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import Cartaz from './Cartaz'
import { clique } from '../lib/visitas'
import Bombando from './Bombando'
import Rostos, { quemVaiDe } from './Rostos'
import { useAmigos } from '../lib/amigos-ctx'
import { rotuloDia, horaDe } from '../lib/datas'
import { bombando, pontos } from '../lib/alta'
import { useAuth } from '../lib/auth'

// "Em alta na semana": os 5 eventos dos próximos 7 dias com mais "Eu vou" (e, no empate, mais acessos).
// Numerados grandes, como uma lista de mais tocadas.
export default function EmAlta({ eventos }) {
  const { user } = useAuth() || {}
  const { vao } = useAmigos()
  const limite = Date.now() + 7 * 86400000
  const top = eventos.filter((e) => e.inicio.getTime() < limite && pontos(e) > 0)
    .sort((a, b) => pontos(b) - pontos(a) || a.inicio - b.inicio).slice(0, 5)
  if (top.length < 3) return null
  return (
    <section aria-labelledby="em-alta" className="mt-7">
      <h2 id="em-alta" className="flex items-center gap-2 font-display text-3xl uppercase leading-none sm:text-4xl">
        <TrendingUp className="size-7 text-brand-ink" aria-hidden /> Em alta na semana
      </h2>
      <p className="mt-1 text-sm text-muted">Os mais marcados com "Eu vou" e os mais vistos.</p>
      <ol className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {top.map((e, i) => {
          const { rostos, texto } = quemVaiDe(e, user, vao)
          const quem = texto || `${e.acessos7} ${e.acessos7 === 1 ? 'pessoa viu' : 'pessoas viram'}`
          return (
            <li key={e.id} className="relative w-[58%] shrink-0 snap-start min-[540px]:w-[38%] md:w-[250px]">
              <Link to={`/evento/${e.id}`} onClick={() => clique('em-alta', e.id)} className="group block">
                <div className="flex items-end">
                  <span className="num-alta -mr-3 w-[30%] shrink-0 text-center font-display text-[7rem] leading-[.75] text-transparent" aria-hidden>{i + 1}</span>
                  <div className="card-evento relative aspect-[4/5] flex-1 overflow-hidden rounded-2xl border border-line bg-surface">
                    <Cartaz evento={e} comData={!e.cartazUrl} marca={false} className="card-img absolute inset-0 size-full" />
                  </div>
                </div>
                <div className="pl-[27%]">
                  {bombando(e) && <Bombando className="mt-1.5" />}
                  <div className="num mt-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-ink">{rotuloDia(e.inicio)} · {horaDe(e)}</div>
                  <div className="line-clamp-1 text-sm font-bold group-hover:text-brand-ink"><span className="sr-only">{i + 1}º: </span>{e.titulo}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">{rostos.length > 0 && <Rostos lista={rostos} tamanho="size-5" anel="ring-bg" />}<span className="line-clamp-1">{quem}</span></div>
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
