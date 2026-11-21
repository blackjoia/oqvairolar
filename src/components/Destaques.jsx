import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, MapPin, CalendarRange, ChevronRight } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { buscarRanking, mesAtual, nomeMes, DEMO } from '../lib/ranking'
import { RANKING_LIGADO } from '../lib/recursos'

// Carrossel do topo da agenda no celular: ranking de pessoas, de bares e a semana.
// Desliza para o lado com encaixe; o próximo cartão aparece pela metade para mostrar que tem mais.
const CORES = ['#c2255c', '#c2410c', '#0f766e', '#3b5bdb', '#7e22ce', '#047857']
const corDe = (t = '') => CORES[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length]

function Rostos({ lista }) {
  return (
    <span className="flex -space-x-2" aria-hidden>
      {lista.slice(0, 3).map((p) => p.foto
        ? <img key={p.uid} src={p.foto} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full object-cover ring-2 ring-[#1a1630]" />
        : <span key={p.uid} className="grid size-8 place-items-center rounded-full text-xs font-bold text-white ring-2 ring-[#1a1630]" style={{ background: corDe(p.nome) }}>{p.nome?.[0]}</span>)}
    </span>
  )
}

export default function Destaques({ semana }) {
  const demo = new URLSearchParams(location.search).has('demo')
  const { user } = useAuth()
  const [r, setR] = useState(null)
  const mes = mesAtual()
  useEffect(() => { if (!RANKING_LIGADO) return; if (demo) setR(DEMO); else buscarRanking(mes).then(setR) }, [demo, mes])
  const pessoas = r?.pessoas || [], bares = r?.bares || []
  const euId = demo ? 'demo2' : user?.uid
  const pos = pessoas.findIndex((p) => p.uid === euId)
  const sufixo = demo ? '?demo' : ''

  const lider = pessoas[0], barLider = bares[0]
  // Computador e tablet: cartão grande ao lado do título (o espaço à direita do topo estava vazio)
  const pc = (
    <Link to={`/ranking${sufixo}`} className="relative hidden overflow-hidden rounded-3xl bg-[#1a1630] p-5 text-white ring-2 ring-inset ring-accent/50 hover:ring-accent md:col-start-2 md:row-span-5 md:row-start-1 md:flex md:flex-col md:self-center">
      <Trophy className="absolute -right-4 -top-4 size-32 rotate-12 text-accent opacity-15" aria-hidden />
      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-accent"><Trophy className="size-4" aria-hidden /> Ranking de {nomeMes(mes)}</span>
      <span className="mt-3 font-display text-3xl uppercase leading-none">{pos >= 0 ? `Você está em ${pos + 1}º` : lider ? `${lider.nome} lidera` : 'Quem vai sair na frente?'}</span>
      <span className="mt-1 text-sm opacity-80">{pos >= 0 ? `Você tem ${pessoas[pos].n} rolês${pos > 0 ? ` · faltam ${pessoas[pos - 1].n - pessoas[pos].n + 1} para subir` : ''}` : lider ? `${lider.n} rolês este mês` : 'Faça "Tô aqui" no rolê e pontue'}</span>
      <ol className="mt-4 space-y-1.5 text-sm">
        {pessoas.slice(0, 3).map((p, i) => <li key={p.uid} className="flex items-center gap-2"><span className="num w-5 font-display text-lg text-accent">{i + 1}</span><span className="flex-1 truncate">{p.nome}</span><span className="num opacity-80">{p.n}</span></li>)}
      </ol>
      <span className="mt-4 border-t border-white/15 pt-3 text-sm"><MapPin className="mr-1 inline size-4 text-accent" aria-hidden />{barLider ? <>Bar mais animado: <b>{barLider.nome}</b></> : 'Qual bar leva o mês?'}</span>
      <span className="btn-accent mt-4 h-11 text-sm">Ver o ranking <ChevronRight className="size-4" aria-hidden /></span>
    </Link>
  )

  const cartao = 'destaque-cartao relative flex min-h-[104px] w-[82%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl p-4 sm:w-[46%]'
  return (<>
    {RANKING_LIGADO && pc}
    <div className="-mx-4 mt-4 md:hidden" aria-label="Destaques">
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {RANKING_LIGADO && <>
        <Link to={`/ranking${sufixo}`} className={`${cartao} bg-[#1a1630] text-white ring-2 ring-inset ring-accent/50`}>
          <Trophy className="absolute -right-3 -top-3 size-24 rotate-12 text-accent opacity-15" aria-hidden />
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-accent"><Trophy className="size-4" aria-hidden /> Ranking de {nomeMes(mes)}</span>
          <span className="mt-2 flex items-end justify-between gap-3">
            <span className="min-w-0">
              <span className="block font-display text-2xl uppercase leading-none">
                {pos >= 0 ? `Você está em ${pos + 1}º` : pessoas[0] ? `${pessoas[0].nome} lidera` : 'Quem vai sair na frente?'}
              </span>
              <span className="mt-1 block text-sm opacity-80">
                {pos >= 0 ? `${pessoas[pos].n} rolês · faltam ${pos > 0 ? pessoas[pos - 1].n - pessoas[pos].n + 1 : 0} para subir` : pessoas[0] ? `${pessoas[0].n} rolês este mês` : 'Faça "Tô aqui" no rolê e pontue'}
              </span>
            </span>
            {pessoas.length > 0 ? <Rostos lista={pessoas} /> : <ChevronRight className="size-6 shrink-0 text-accent" aria-hidden />}
          </span>
        </Link>
        <Link to={`/ranking${sufixo ? sufixo + '&' : '?'}aba=bares`} className={`${cartao} bg-brand text-on-brand`}>
          <MapPin className="absolute -right-3 -top-3 size-24 -rotate-12 opacity-15" aria-hidden />
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest"><MapPin className="size-4" aria-hidden /> Bar mais animado</span>
          <span className="mt-2 flex items-end justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-display text-2xl uppercase leading-none">{bares[0] ? bares[0].nome : 'Qual bar leva o mês?'}</span>
              <span className="mt-1 block text-sm opacity-85">{bares[0] ? `${bares[0].n} check-ins${bares[1] ? ` · ${bares[1].nome} em 2º` : ''}` : 'Cada "Tô aqui" vale ponto para o bar'}</span>
            </span>
            <ChevronRight className="size-6 shrink-0" aria-hidden />
          </span>
        </Link>
        </>}
        <Link to="/semana" className={`${cartao} bg-accent text-on-accent ${RANKING_LIGADO ? '' : '!w-full'}`}>
          <CalendarRange className="absolute -right-3 -top-3 size-24 rotate-6 opacity-15" aria-hidden />
          <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest"><CalendarRange className="size-4" aria-hidden /> Esta semana</span>
          <span className="mt-2 flex items-end justify-between gap-3">
            <span className="block font-display text-2xl uppercase leading-none">{semana ? `${semana} ${semana === 1 ? 'rolê' : 'rolês'} nos próximos 7 dias` : 'A semana inteira'}</span>
            <ChevronRight className="size-6 shrink-0" aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  </>)
}
