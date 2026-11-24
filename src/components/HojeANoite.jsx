import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import Cartaz from './Cartaz'
import { clique } from '../lib/visitas'
import Bombando from './Bombando'
import { faixaDia, horaDe, situacao } from '../lib/datas'
import { bombando } from '../lib/alta'

// Faixa de cartazes grandes no topo, deslizando como stories: o que rola hoje à noite.
// Sem nada à noite, mostra o que tem hoje; sem nada hoje, o que tem amanhã.
function escolher(eventos, agora = new Date()) {
  const naFaixa = (id) => { const [ini, fim] = faixaDia(id); return eventos.filter((e) => e.inicio < fim && (e.fim || e.inicio) >= ini && situacao(e, agora)?.tipo !== 'passou') }
  const hoje = naFaixa('hoje')
  const noite = hoje.filter((e) => e.inicio.getHours() >= 17 || situacao(e, agora)?.tipo === 'agora')
  if (noite.length) return { titulo: 'Hoje à noite', itens: noite }
  if (hoje.length) return { titulo: 'Hoje', itens: hoje }
  const amanha = naFaixa('amanha')
  if (amanha.length) return { titulo: 'Amanhã', itens: amanha }
  return null
}

export default function HojeANoite({ eventos }) {
  const r = escolher(eventos)
  if (!r) return null
  const itens = [...r.itens].sort((a, b) => (situacao(b)?.tipo === 'agora') - (situacao(a)?.tipo === 'agora') || (b.vao || 0) - (a.vao || 0) || a.inicio - b.inicio).slice(0, 12)
  return (
    <section aria-labelledby="hoje-noite" className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="hoje-noite" className="flex items-center gap-2 font-display text-3xl uppercase leading-none sm:text-4xl">
          {r.titulo !== 'Amanhã' && <span className="ao-vivo size-2.5 rounded-full bg-[#ff4d1a]" aria-hidden />}
          {r.titulo}
        </h2>
        <span className="num text-sm font-semibold text-muted">{r.itens.length} {r.itens.length === 1 ? 'rolê' : 'rolês'}</span>
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {itens.map((e) => {
          const agora = situacao(e)?.tipo === 'agora'
          return (
            <Link key={e.id} to={`/evento/${e.id}`} onClick={() => clique('hoje-a-noite', e.id)} className="card-evento group relative aspect-[3/4] w-[44%] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface min-[540px]:w-[30%] md:w-[200px]">
              <Cartaz evento={e} comData={false} marca={false} className="card-img absolute inset-0 size-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent p-2.5 pt-10 text-white">
                {!agora && bombando(e) && <Bombando className="mb-1" />}
                <div className="num text-xs font-extrabold uppercase tracking-wide text-accent">{agora ? 'Rolando agora' : horaDe(e)}</div>
                {e.cartazUrl && <div className="line-clamp-2 font-display text-base uppercase leading-tight">{e.titulo}</div>}
                <div className="mt-0.5 flex items-center gap-1 text-[11px] opacity-90"><MapPin className="size-3 shrink-0" aria-hidden /><span className="line-clamp-1">{e.localNome || e.cidade}</span></div>
              </div>
              {agora && <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-[#1a1630]/90 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white"><span className="ao-vivo size-1.5 rounded-full bg-[#ff4d1a]" aria-hidden />Agora</span>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
