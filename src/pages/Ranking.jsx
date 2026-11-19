import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Topo from '../components/Topo'
import Segmentado from '../components/Segmentado'
import { Rodape } from './Inicio'
import { useAuth } from '../lib/auth'
import { buscarRanking, mesAtual, nomeMes } from '../lib/ranking'
import { ArrowLeft, Trophy, MapPin, Share2, Check } from 'lucide-react'

// Dados fictícios para mostrar como fica (abra /ranking?demo). Bares reais de Beltrão, números inventados.
const pessoa = (nome, n, i) => ({ uid: 'demo' + i, nome, n, foto: '' })
const DEMO = {
  pessoas: [['Ana P.', 9], ['Rafa M.', 8], ['Luis', 7], ['Bruna K.', 6], ['Diego S.', 5], ['Carol T.', 5], ['Jean F.', 4], ['Mari L.', 3], ['Tiago R.', 2], ['Gabi C.', 1]].map(([n, x], i) => pessoa(n, x, i)),
  bares: [['Formosa Pub', 'formosa-pub', 38], ['Bar do Plets', 'plets', 33], ['Boteco Choppbel', 'boteco-choppbel', 21], ['Hangar 80', 'hangar-80', 16], ['Alles', 'alles', 9], ["Neco's Boteco", 'necos-boteco', 4]].map(([nome, slug, n]) => ({ nome, slug, n })),
}

// Ranking do mês: quem mais foi em rolê e os bares mais movimentados. Zera todo dia 1º.
export default function Ranking() {
  const { user } = useAuth()
  const [aba, setAba] = useState('pessoas')
  const [r, setR] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const mes = mesAtual()
  const demo = new URLSearchParams(location.search).has('demo')
  useEffect(() => { if (demo) setR(DEMO); else buscarRanking(mes).then(setR) }, [mes, demo])
  useEffect(() => { document.title = 'Ranking do mês · O Que Vai Rolar?' }, [])

  const lista = r ? (aba === 'pessoas' ? r.pessoas : r.bares) || [] : null
  const minha = user && r?.pessoas ? r.pessoas.findIndex((p) => p.uid === user.uid) : -1
  const compartilhar = async () => {
    const eu = minha >= 0 ? r.pessoas[minha] : null
    const texto = eu ? `Tô em ${minha + 1}º no ranking de rolês de ${nomeMes(mes)}, com ${eu.n} ${eu.n === 1 ? 'rolê' : 'rolês'}. Duvido você me passar.` : `Quem mais sai em Beltrão? Ranking de rolês de ${nomeMes(mes)}.`
    const url = `${location.origin}/ranking?o=ranking`
    if (navigator.share) { try { await navigator.share({ text: texto, url }) } catch {} return }
    await navigator.clipboard.writeText(`${texto} ${url}`); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-2xl px-4 pb-20 pt-4">
        <Link to="/" className="link-toque -my-2 gap-1 text-sm font-semibold text-brand-ink"><ArrowLeft className="size-4" aria-hidden /> Agenda</Link>
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-brand-ink">Ranking de {nomeMes(mes)}</p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,9vw,4.5rem)] uppercase leading-[.9]">Quem mais <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">sai</span></h1>
        <p className="mt-3 text-muted">{aba === 'pessoas'
          ? <>Cada rolê em que você toca em <b>Tô aqui</b>, no local e na hora do evento, vale 1 ponto. Só marcar "Eu vou" não conta. Zera todo dia 1º.</>
          : <>Cada pessoa que faz <b>Tô aqui</b> no bar, na hora do rolê, vale 1 ponto para ele.</>}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Segmentado rotulo="Ranking" valor={aba} onChange={setAba} opcoes={[{ id: 'pessoas', nome: 'Pessoas' }, { id: 'bares', nome: 'Bares e locais' }]} />
          <button onClick={compartilhar} className="btn-ghost h-11 text-sm">{copiado ? <><Check className="size-4" aria-hidden /> Copiado</> : <><Share2 className="size-4" aria-hidden /> {minha >= 0 ? 'Desafiar amigos' : 'Compartilhar'}</>}</button>
        </div>

        {demo && <p className="mt-4 rounded-xl bg-amber-400/20 p-3 text-sm font-semibold">Exemplo com números inventados, só para mostrar como fica.</p>}
        {minha >= 0 && aba === 'pessoas' && (
          <p className="mt-4 rounded-2xl bg-accent/20 p-4 font-semibold">Você está em <b className="num">{minha + 1}º</b> com <b className="num">{r.pessoas[minha].n}</b> {r.pessoas[minha].n === 1 ? 'rolê' : 'rolês'}.</p>
        )}

        {!lista && <div className="mt-6 space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="esqueleto h-16 rounded-2xl" />)}</div>}
        {lista && lista.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center">
            <Trophy className="mx-auto mb-2 size-10 text-brand-ink" aria-hidden />
            <p className="font-display text-2xl uppercase">Ninguém pontuou ainda</p>
            <p className="mt-1 text-muted">No próximo rolê, toque em <b>Tô aqui</b> na página do evento e saia na frente.</p>
            <Link to="/" className="btn-accent mt-4">Ver a agenda</Link>
          </div>
        )}
        {lista && lista.length > 0 && (
          <ol className="mt-5 space-y-2">
            {lista.map((x, i) => {
              const conteudo = (<>
                <span className={`num grid size-10 shrink-0 place-items-center rounded-xl font-display text-xl ${i === 0 ? 'bg-accent text-on-accent' : i < 3 ? 'bg-brand text-on-brand' : 'bg-surface-2'}`}>{i + 1}</span>
                {aba === 'pessoas'
                  ? (x.foto ? <img src={x.foto} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full object-cover" /> : <span className="grid size-10 place-items-center rounded-full bg-surface-2 font-bold">{x.nome?.[0]}</span>)
                  : <MapPin className="size-5 shrink-0 text-brand-ink" aria-hidden />}
                <span className="min-w-0 flex-1 truncate font-semibold">{x.nome}{user && x.uid === user.uid ? ' (você)' : ''}</span>
                <span className="num shrink-0 text-sm font-bold">{x.n} {aba === 'pessoas' ? (x.n === 1 ? 'rolê' : 'rolês') : (x.n === 1 ? 'check-in' : 'check-ins')}</span>
              </>)
              const cls = `flex items-center gap-3 rounded-2xl border bg-surface p-3 ${user && x.uid === user.uid ? 'border-brand' : 'border-line'}`
              return <li key={x.uid || x.slug}>{aba === 'pessoas' ? <Link to={`/u/${x.uid}`} className={cls}>{conteudo}</Link> : <Link to={`/local/${x.slug}`} className={cls}>{conteudo}</Link>}</li>
            })}
          </ol>
        )}
        <p className="mt-6 text-xs text-muted">Só aparece no ranking quem deixou "Aparecer em quem vai" ligado. Atualiza a cada 10 minutos.</p>
      </main><Rodape /></>
  )
}
