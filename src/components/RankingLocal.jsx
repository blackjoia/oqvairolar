import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, MapPinCheck } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { rankingDoLocal, mesAtual, nomeMes } from '../lib/ranking'

// "Dono da mesa": quem mais fez "Tô aqui" neste bar no mês (zera todo dia 1º), como o prefeito do Foursquare.
const CORES = ['#c2255c', '#c2410c', '#0f766e', '#3b5bdb', '#7e22ce', '#047857']
const corDe = (t = '') => CORES[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length]
const Rosto = ({ p, cls }) => p.foto
  ? <img src={p.foto} alt="" referrerPolicy="no-referrer" className={`${cls} rounded-full object-cover`} />
  : <span className={`${cls} grid place-items-center rounded-full font-bold text-white`} style={{ background: corDe(p.nome) }} aria-hidden>{p.nome?.[0]}</span>

export default function RankingLocal({ slug, nome }) {
  const { user } = useAuth()
  const [lista, setLista] = useState(null)
  useEffect(() => { rankingDoLocal(slug).then(setLista) }, [slug])
  if (!lista) return null
  const dono = lista[0]
  const euId = new URLSearchParams(location.search).has('demo') ? 'demo2' : user?.uid
  const minha = lista.findIndex((p) => p.uid === euId)
  const falta = dono ? (minha === 0 ? 0 : dono.n - (minha > 0 ? lista[minha].n : 0) + 1) : 1

  return (
    <section aria-labelledby="titulo-dono" className="mt-8 overflow-hidden rounded-3xl bg-[#1a1630] text-white ring-2 ring-inset ring-accent/50">
      <div className="relative p-5 sm:p-6">
        <Crown className="absolute -right-4 -top-4 size-32 rotate-12 text-accent opacity-15" aria-hidden />
        <p className="text-xs font-extrabold uppercase tracking-widest text-accent">Dono da mesa · {nomeMes(mesAtual())}</p>
        {dono ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative shrink-0">
              <Rosto p={dono} cls="size-16 text-2xl ring-4 ring-accent" />
              <Crown className="absolute -top-4 left-1/2 size-6 -translate-x-1/2 text-accent" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="titulo-dono" className="truncate font-display text-3xl uppercase leading-none">{dono.nome}{minha === 0 ? ' (você)' : ''}</h2>
              <p className="num mt-1 text-sm opacity-80">{dono.n} {dono.n === 1 ? 'check-in' : 'check-ins'} no {nome}</p>
            </div>
          </div>
        ) : (
          <h2 id="titulo-dono" className="mt-3 font-display text-3xl uppercase leading-none">A mesa está livre</h2>
        )}
        <p className="mt-4 rounded-2xl bg-white/10 px-3 py-2 text-sm">
          {minha === 0 ? 'Você é o dono da mesa. Continue vindo para não perder o posto.'
            : <>Faça <b>{falta}</b> {falta === 1 ? 'check-in' : 'check-ins'} aqui para tomar a mesa{dono ? <> de <b>{dono.nome.replace(/\.$/, "")}</b></> : ""}. Toque em <b>Tô aqui</b> na página do evento, quando estiver no local.</>}
        </p>
      </div>
      {lista.length > 1 && (
        <ol aria-label={`Quem mais vem ao ${nome}`} className="border-t border-white/10 bg-white/5">
          {lista.slice(1, 6).map((p, i) => (
            <li key={p.uid} className={i ? 'border-t border-white/10' : ''}>
              <Link to={`/u/${p.uid}`} className={`flex min-h-12 items-center gap-3 px-5 py-2 hover:bg-white/5 ${p.uid === euId ? 'bg-accent/15' : ''}`}>
                <span className="num w-6 text-center font-display text-lg text-accent">{i + 2}</span>
                <Rosto p={p} cls="size-8 text-xs" />
                <span className="min-w-0 flex-1 truncate font-semibold">{p.nome}{p.uid === euId ? ' (você)' : ''}</span>
                <span className="num text-sm opacity-80">{p.n}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="flex items-center gap-1.5 border-t border-white/10 px-5 py-3 text-xs opacity-70"><MapPinCheck className="size-3.5" aria-hidden /> Vale só "Tô aqui" feito no local, na hora do evento.</p>
    </section>
  )
}
