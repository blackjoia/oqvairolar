import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Topo from '../components/Topo'
import Segmentado from '../components/Segmentado'
import { Rodape } from './Inicio'
import { useAuth } from '../lib/auth'
import { buscarRanking, mesAtual, nomeMes } from '../lib/ranking'
import { ArrowLeft, Trophy, MapPin, Share2, Check, Crown, MapPinCheck, Timer } from 'lucide-react'

// Dados fictícios para mostrar como fica (abra /ranking?demo). Bares reais de Beltrão, números inventados.
const pessoa = (nome, n, i) => ({ uid: 'demo' + i, nome, n, foto: '' })
const DEMO = {
  pessoas: [['Ana P.', 9], ['Rafa M.', 8], ['Luis', 7], ['Bruna K.', 6], ['Diego S.', 5], ['Carol T.', 5], ['Jean F.', 4], ['Mari L.', 3], ['Tiago R.', 2], ['Gabi C.', 1]].map(([n, x], i) => pessoa(n, x, i)),
  bares: [['Formosa Pub', 'formosa-pub', 38], ['Bar do Plets', 'plets', 33], ['Boteco Choppbel', 'boteco-choppbel', 21], ['Hangar 80', 'hangar-80', 16], ['Alles', 'alles', 9], ["Neco's Boteco", 'necos-boteco', 4]].map(([nome, slug, n]) => ({ nome, slug, n })),
}

// Ranking do mês: quem mais foi em rolê e os bares mais movimentados. Zera todo dia 1º.
// Regras de tela (ui-ux-pro-max): pódio só para os 3 primeiros, uma animação por tela, números tabulares,
// alvos de toque de 56 px, aba no endereço (?aba=bares), estado vazio com ação, sem animação se a pessoa pediu menos movimento.
const CORES = ['#c2255c', '#c2410c', '#0f766e', '#3b5bdb', '#7e22ce', '#047857'] // todas com contraste 4,5:1 para a letra branca
const corDe = (t = '') => CORES[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length]

function Avatar({ x, tamanho = 'size-11', bar }) {
  if (bar) return <span className={`grid ${tamanho} shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand-ink`}><MapPin className="size-5" aria-hidden /></span>
  if (x.foto) return <img src={x.foto} alt="" referrerPolicy="no-referrer" className={`${tamanho} shrink-0 rounded-full object-cover`} />
  return <span className={`grid ${tamanho} shrink-0 place-items-center rounded-full font-bold text-white`} style={{ background: corDe(x.nome) }} aria-hidden>{x.nome?.[0]}</span>
}

const unidade = (n, bar) => bar ? (n === 1 ? 'check-in' : 'check-ins') : (n === 1 ? 'rolê' : 'rolês')
const diasParaZerar = () => {
  const agora = new Date(); const prox = new Date(agora.getFullYear(), agora.getMonth() + 1, 1)
  return Math.max(1, Math.ceil((prox - agora) / 86400000))
}

// Pódio: 2º, 1º, 3º lado a lado, o 1º mais alto.
function Podio({ lista, bar, eu }) {
  const ordem = [1, 0, 2].map((i) => lista[i] && { ...lista[i], pos: i + 1 }).filter(Boolean)
  const altura = { 1: 'h-28', 2: 'h-20', 3: 'h-14' }
  return (
    <div className="podio mt-6 grid grid-cols-3 items-end gap-2" aria-hidden>
      {ordem.map((x) => (
        <Link key={x.uid || x.slug} to={bar ? `/local/${x.slug}` : `/u/${x.uid}`} className="group flex min-w-0 flex-col items-center text-center">
          {x.pos === 1 && <Crown className="mb-1 size-6 text-brand-ink" />}
          <Avatar x={x} bar={bar} tamanho={x.pos === 1 ? 'size-16' : 'size-12'} />
          <span className="mt-1.5 w-full truncate text-sm font-bold group-hover:text-brand-ink">{x.nome}{eu === (x.uid || x.slug) ? ' (você)' : ''}</span>
          <span className="num text-xs text-muted">{x.n} {unidade(x.n, bar)}</span>
          <span className={`podio-degrau mt-2 grid w-full place-items-start justify-center rounded-t-2xl pt-2 font-display text-3xl ${altura[x.pos]} ${x.pos === 1 ? 'bg-accent text-on-accent' : 'bg-brand text-on-brand'}`} style={{ '--d': x.pos === 1 ? '120ms' : x.pos === 2 ? '0ms' : '240ms' }}>{x.pos}</span>
        </Link>
      ))}
    </div>
  )
}

export default function Ranking() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') === 'bares' ? 'bares' : 'pessoas'
  const setAba = (a) => { const p = new URLSearchParams(params); if (a === 'pessoas') p.delete('aba'); else p.set('aba', a); setParams(p, { replace: true }) }
  const [r, setR] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const mes = mesAtual()
  const demo = params.has('demo')
  useEffect(() => { if (demo) setR(DEMO); else buscarRanking(mes).then(setR) }, [mes, demo])
  useEffect(() => { document.title = 'Ranking do mês · O Que Vai Rolar?' }, [])

  const bar = aba === 'bares'
  const lista = r ? (bar ? r.bares : r.pessoas) || [] : null
  const euId = demo ? 'demo2' : user?.uid
  const minha = r?.pessoas ? r.pessoas.findIndex((p) => p.uid === euId) : -1
  const eu = minha >= 0 ? r.pessoas[minha] : null
  const frente = minha > 0 ? r.pessoas[minha - 1] : null
  const faltam = frente ? frente.n - eu.n + 1 : 0

  const compartilhar = async () => {
    const texto = eu ? `Tô em ${minha + 1}º no ranking de rolês de ${nomeMes(mes)}, com ${eu.n} ${unidade(eu.n)}. Duvido você me passar.` : `Quem mais sai em Beltrão? Ranking de rolês de ${nomeMes(mes)}.`
    const url = `${location.origin}/ranking?o=ranking`
    if (navigator.share) { try { await navigator.share({ text: texto, url }) } catch {} return }
    await navigator.clipboard.writeText(`${texto} ${url}`); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-2xl px-4 pb-20 pt-4">
        <Link to="/" className="link-toque -my-2 gap-1 text-sm font-semibold text-brand-ink"><ArrowLeft className="size-4" aria-hidden /> Agenda</Link>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-ink">Ranking de {nomeMes(mes)}</p>
          <p className="num inline-flex items-center gap-1 text-xs font-semibold text-muted"><Timer className="size-3.5" aria-hidden /> zera em {diasParaZerar()} {diasParaZerar() === 1 ? 'dia' : 'dias'}</p>
        </div>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,9vw,4.5rem)] uppercase leading-[.9]">Quem mais <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">sai</span></h1>

        <div className="mt-5"><Segmentado rotulo="Ranking" valor={aba} onChange={setAba} opcoes={[{ id: 'pessoas', nome: 'Pessoas' }, { id: 'bares', nome: 'Bares e locais' }]} /></div>
        <p className="mt-3 max-w-prose text-sm text-muted">{bar
          ? <>Cada pessoa que faz <b className="text-ink">Tô aqui</b> no local, na hora do rolê, vale 1 ponto para o bar.</>
          : <>Vale 1 ponto cada rolê em que você toca em <b className="text-ink">Tô aqui</b>, no local e na hora do evento. Só marcar "Eu vou" não conta.</>}</p>
        {demo && <p className="mt-3 rounded-xl bg-amber-400/20 px-3 py-2 text-sm font-semibold">Exemplo com números inventados, só para mostrar como fica.</p>}

        {/* Sua posição: o gancho para voltar (quanto falta para passar quem está na frente) */}
        {!bar && eu && (
          <section aria-label="Sua posição" className="mt-5 rounded-3xl bg-[#1a1630] p-4 text-white sm:p-5">
            <div className="flex items-center gap-3">
              <span className="num font-display text-5xl leading-none text-accent">{minha + 1}º</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Você tem {eu.n} {unidade(eu.n)} em {nomeMes(mes)}</p>
                <p className="text-sm opacity-80">{frente ? <>Faltam <b className="num">{faltam}</b> para passar {frente.nome}</> : 'Você está na frente. Segura o posto!'}</p>
              </div>
            </div>
            {frente && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label={`Progresso até passar ${frente.nome}`} aria-valuemin={0} aria-valuemax={frente.n + 1} aria-valuenow={eu.n}>
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (eu.n / (frente.n + 1)) * 100)}%` }} /></div>}
            <button onClick={compartilhar} className="btn-accent mt-4 h-11 w-full text-sm">{copiado ? <><Check className="size-4" aria-hidden /> Copiado</> : <><Share2 className="size-4" aria-hidden /> Desafiar os amigos</>}</button>
          </section>
        )}

        {!lista && <div className="mt-6 space-y-2" aria-label="Carregando">{[1, 2, 3, 4].map((i) => <div key={i} className="esqueleto h-14 rounded-2xl" />)}</div>}
        {lista && lista.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-line p-8 text-center">
            <Trophy className="mx-auto mb-2 size-10 text-brand-ink" aria-hidden />
            <p className="font-display text-2xl uppercase">Ninguém pontuou ainda</p>
            <p className="mt-1 text-muted">No próximo rolê, toque em <b>Tô aqui</b> na página do evento e saia na frente.</p>
            <Link to="/" className="btn-accent mt-4">Ver a agenda</Link>
          </div>
        )}
        {lista && lista.length > 0 && (<>
          <Podio lista={lista} bar={bar} eu={bar ? null : euId} />
          <ol aria-label={bar ? 'Bares e locais com mais check-ins' : 'Pessoas com mais rolês'} className="cascata mt-0 overflow-hidden rounded-b-3xl rounded-t-none border border-line bg-surface">
            {lista.map((x, i) => {
              const souEu = !bar && x.uid === euId
              return (
                <li key={x.uid || x.slug} style={{ '--i': i }} className={i < 3 ? 'sr-only' : i > 3 ? 'border-t border-line' : ''}>
                  <Link to={bar ? `/local/${x.slug}` : `/u/${x.uid}`} className={`flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-surface-2 ${souEu ? 'bg-accent/15' : ''}`}>
                    <span className="num w-7 shrink-0 text-center font-display text-xl text-muted">{i + 1}</span>
                    <Avatar x={x} bar={bar} tamanho="size-9" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{x.nome}{souEu ? ' (você)' : ''}</span>
                    <span className="num shrink-0 text-sm font-bold">{x.n} <span className="font-normal text-muted">{unidade(x.n, bar)}</span></span>
                  </Link>
                </li>
              )
            })}
          </ol>
          {!eu && !bar && <button onClick={compartilhar} className="btn-ghost mt-4 h-11 text-sm">{copiado ? <><Check className="size-4" aria-hidden /> Copiado</> : <><Share2 className="size-4" aria-hidden /> Compartilhar o ranking</>}</button>}
        </>)}
        <p className="mt-6 flex items-start gap-1.5 text-xs text-muted"><MapPinCheck className="mt-px size-3.5 shrink-0" aria-hidden /> Só aparece quem deixou "Aparecer em quem vai" ligado. Atualiza a cada 10 minutos.</p>
      </main><Rodape /></>
  )
}
