import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import Cartaz from './Cartaz'
import Rostos from './Rostos'
import { useAuth } from '../lib/auth'
import { useAmigos } from '../lib/amigos-ctx'
import { rotuloDia, horaDe } from '../lib/datas'
import { clique } from '../lib/visitas'

// "Seus amigos vão": só aparece para quem tem amigo adicionado E algum amigo marcou Eu vou num rolê que ainda vai rolar.
export default function AmigosVao({ eventos }) {
  const { usuario } = useAuth()
  const { amigos, vao } = useAmigos()
  if (!usuario || !amigos.length || !eventos) return null
  const agora = Date.now()
  const lista = eventos.filter((e) => vao[e.id]?.length && (e.fim || e.inicio).getTime() > agora)
    .sort((a, b) => a.inicio - b.inicio).slice(0, 10)
  if (!lista.length) return null
  return (
    <section aria-labelledby="amigos-vao" className="mt-7">
      <h2 id="amigos-vao" className="flex items-center gap-2 font-display text-3xl uppercase leading-none sm:text-4xl">
        <Users className="size-7 text-brand-ink" aria-hidden /> Seus amigos vão
      </h2>
      <ul className="no-scrollbar -mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {lista.map((e) => {
          const fs = vao[e.id].map((p) => ({ uid: p.uid, nome: p.nome?.split(' ')[0], foto: p.foto, amigo: true }))
          const texto = fs.length === 1 ? `${fs[0].nome} vai` : fs.length === 2 ? `${fs[0].nome} e ${fs[1].nome} vão` : `${fs[0].nome} e mais ${fs.length - 1} vão`
          return (
            <li key={e.id} className="w-[44%] shrink-0 snap-start min-[540px]:w-[30%] md:w-[200px]">
              <Link to={`/evento/${e.id}`} onClick={() => clique('amigos-vao', e.id)} className="group block">
                <div className="card-evento relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface">
                  <Cartaz evento={e} comData={!e.cartazUrl} marca={false} className="card-img absolute inset-0 size-full" />
                </div>
                <div className="num mt-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-ink">{rotuloDia(e.inicio)} · {horaDe(e)}</div>
                <div className="line-clamp-1 text-sm font-bold group-hover:text-brand-ink">{e.titulo}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-bold"><Rostos lista={fs} tamanho="size-5" /><span className="line-clamp-1">{texto}</span></div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
