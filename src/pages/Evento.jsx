import { useEffect, useState, lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import Topo from '../components/Topo'
import Cartaz from '../components/Cartaz'
import { Rodape } from './Inicio'
import { buscarEvento, slugify } from '../lib/eventos'
import { rotuloDia, hora, asHora, situacao } from '../lib/datas'
import { categoria } from '../lib/constantes'
import { linkGoogleAgenda, baixarIcs, linkComoChegar } from '../lib/agenda'
import { useAuth } from '../lib/auth'
// O mapa (Leaflet) só carrega quando a página precisa dele.
const MapaVer = lazy(() => import('../components/MapaVer'))
import { gerarStory } from '../lib/story'
import { Programacao, FazParte } from '../components/Programacao'
import { janelaCheckin, jaFiz, fazerCheckin } from '../lib/ranking'
import { RANKING_LIGADO } from '../lib/recursos'
import { clique } from '../lib/visitas'
import { podeLembrar, temLembrete, ligarLembrete, desligarLembrete } from '../lib/lembrete'
import { abrirInstalar } from '../components/InstalarApp'
import { km, textoDistancia, useMinhaPosicao, pedirLocalizacao } from '../lib/distancia'
import { minhaPresenca, contarPresencas, marcarPresenca } from '../lib/presenca'
import { CalendarDays, MapPin, Ticket, Instagram, CalendarPlus, Share2, Check, Navigation, ImageDown, ArrowLeft, PartyPopper, Star, Bell, BellRing, LoaderCircle, MessageCircle, MapPinCheck } from 'lucide-react'

export default function Evento() {
  const { id } = useParams()
  const { isAdmin, user, usuario } = useAuth()
  const [rostos, setRostos] = useState([])
  const [aviso, setAviso] = useState('')
  const [e, setE] = useState(undefined)
  const pos = useMinhaPosicao()
  const [erroLocal, setErroLocal] = useState('')
  const [lembrete, setLembrete] = useState({ suporte: null, ligado: false, carregando: false, erro: '' })
  useEffect(() => { podeLembrar().then((suporte) => setLembrete((l) => ({ ...l, suporte, ligado: temLembrete(id) }))).catch(() => {}) }, [id])
  async function alternarLembrete() {
    if (lembrete.suporte === 'ios-instalar') { abrirInstalar(); return }
    setLembrete((l) => ({ ...l, carregando: true, erro: '' }))
    try {
      if (lembrete.ligado) { await desligarLembrete(id); setLembrete((l) => ({ ...l, ligado: false, carregando: false })) }
      else { await ligarLembrete(id); setLembrete((l) => ({ ...l, ligado: true, carregando: false })) }
    } catch (x) { setLembrete((l) => ({ ...l, carregando: false, erro: x.message || 'Não deu para ativar o lembrete agora.' })) }
  }
  const [copiado, setCopiado] = useState(false)
  const [agendaAberta, setAgendaAberta] = useState(false)
  const [story, setStory] = useState('')
  const [minha, setMinha] = useState(null)
  const [contagem, setContagem] = useState({ vou: 0, interesse: 0 })
  const [checkin, setCheckin] = useState({ feito: false, carregando: false, erro: '' })
  useEffect(() => { if (user && !id.endsWith('-demo')) jaFiz(id).then((f) => setCheckin((c) => ({ ...c, feito: f }))) }, [id, user?.uid])
  const toAqui = async () => {
    setCheckin({ feito: false, carregando: true, erro: '' })
    const erro = await fazerCheckin(e)
    setCheckin({ feito: !erro, carregando: false, erro: erro || '' })
    if (!erro && minha !== 'vou') presenca('vou')
  }
  useEffect(() => {
    if (id.endsWith('-demo')) return
    minhaPresenca(id).then(setMinha); contarPresencas(id).then(setContagem)
    // "Quem vai" só aparece para quem entrou com a conta
    if (user) import('../lib/social').then((m) => m.quemVai(id)).then(setRostos).catch(() => {})
    else setRostos([])
  }, [id, user?.uid])
  const presenca = async (tipo) => {
    const novo = minha === tipo ? null : tipo
    setContagem((c) => ({ ...c, ...(minha ? { [minha]: Math.max(0, c[minha] - 1) } : {}), ...(novo ? { [novo]: (minha === novo ? c[novo] : c[novo] + 1) } : {}) }))
    setMinha(novo)
    try { await marcarPresenca(id, novo, usuario?.publico) } catch { /* sem internet: fica só local */ }
    if (novo && !usuario) setAviso('Entre com o Google para guardar nos seus rolês e ver em qualquer aparelho.')
    if (usuario?.publico) import('../lib/social').then((m) => m.quemVai(id)).then(setRostos).catch(() => {})
  }

  useEffect(() => {
    buscarEvento(id).then(setE).catch(() => setE(null))
  }, [id, isAdmin])

  useEffect(() => {
    if (e) document.title = `${e.titulo} · O Que Vai Rolar?`
    return () => { document.title = 'O Que Vai Rolar? · Agenda do Sudoeste do Paraná' }
  }, [e])

  if (e === undefined) return (<><Topo /><div className="mx-auto mt-8 h-96 max-w-3xl animate-pulse rounded-2xl bg-surface-2 px-4" /></>)
  if (!e) return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-4xl uppercase">Evento não encontrado</p>
        <p className="mt-2 text-muted">Pode ter sido removido ou o link está errado.</p>
        <Link to="/" className="btn-brand mt-6">Ver a agenda</Link>
      </main></>
  )

  const url = `${location.origin}/evento/${e.id}`
  const cat = categoria(e.categoria)
  const compartilhar = async () => {
    clique('compartilhar', e.id)
    const dados = { title: e.titulo, text: `${e.titulo}\n${rotuloDia(e.inicio)} ${asHora(e)} · ${[e.localNome, e.cidade].filter(Boolean).join(', ')}`, url: url + '?o=compartilhado' }
    if (navigator.share) { try { await navigator.share(dados) } catch {} return }
    await navigator.clipboard.writeText(url + '?o=compartilhado'); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  const temMapa = e.lat && e.lng

  return (
    <>
      <Topo>{isAdmin ? <Link to={`/admin/evento/${e.id}`} className="btn-ghost py-2 text-sm">Editar</Link> : undefined}</Topo>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <Link to="/" className="link-toque -my-2 gap-1 text-sm font-semibold text-brand-ink"><ArrowLeft className="size-4" aria-hidden /> Agenda</Link>
        {e.status !== 'publicado' && (
          <p className="mt-3 rounded-xl bg-amber-400/20 p-3 text-sm font-semibold">Este evento está como "{e.status}" e só você (admin) consegue ver.</p>
        )}
        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {e.cartazUrl ? (
            <Cartaz evento={e} className="aspect-[4/5] w-full rounded-2xl border border-line md:sticky md:top-24" />
          ) : (<>
            {/* Sem cartaz de verdade: no celular, faixa baixa para data, local e botões aparecerem sem rolar */}
            <Cartaz evento={e} largo className="aspect-[16/9] w-full rounded-2xl border border-line md:hidden" />
            <Cartaz evento={e} className="hidden aspect-[4/5] w-full rounded-2xl border border-line md:sticky md:top-24 md:block" />
          </>)}

          <div>
            <span className="inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-ink">
              <cat.Icone className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />{cat.nome}
            </span>
            <h1 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">{e.titulo}</h1>
            {e.pai && <FazParte evento={e} />}
            {!!e.atracoes?.length && (
              <p className="mt-3 text-lg font-semibold">Com {e.atracoes.map((a, i) => (
                <span key={a}>{i > 0 && (i === e.atracoes.length - 1 ? ' e ' : ', ')}
                  {a.startsWith('@')
                    ? <a className="text-brand-ink" target="_blank" rel="noreferrer" onClick={() => clique('instagram', e.id)} href={`https://instagram.com/${a.slice(1)}`}>{a}</a>
                    : <Link className="text-brand-ink" to={`/local/${slugify(a)}`}>{a}</Link>}
                </span>))}</p>
            )}
            {!!e.generos?.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.generos.map((g) => <Link key={g} to={`/?genero=${encodeURIComponent(g)}`} className="rounded-full border border-line px-2.5 py-0.5 text-sm font-semibold text-muted hover:border-brand hover:text-brand-ink">{g}</Link>)}
              </div>
            )}

            <dl className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex gap-3"><dt aria-label="Quando"><CalendarDays className="size-5 text-brand-ink" /></dt>
                <dd><b>{rotuloDia(e.inicio)}</b>, {asHora(e).replace(/[()]/g, '')}{e.fim && !e.semHora ? ` até ${e.fim - e.inicio > 24 * 3600000 ? rotuloDia(e.fim).toLowerCase() + ', ' : ''}${hora(e.fim)}` : ''}
                  {(() => { const s = situacao(e); return s && <div className={`mt-1 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold ${s.tipo === 'passou' ? 'bg-surface-2 text-muted' : 'bg-accent text-on-accent'}`}>{s.tipo === 'agora' && <span className="ao-vivo size-2 rounded-full bg-on-accent" aria-hidden />}{s.texto}</div> })()}</dd></div>
              <div className="flex gap-3"><dt aria-label="Onde"><MapPin className="size-5 text-brand-ink" /></dt>
                <dd>{e.localNome ? <Link to={`/local/${slugify(e.localNome)}`} className="font-bold hover:text-brand-ink">{e.localNome}</Link> : <b>Local a confirmar</b>}
                  <div className="text-sm text-muted">{[e.endereco, e.cidade].filter(Boolean).join(' · ')}</div>
                  {km({ lat: 0, lng: 0 }, e) != null && (pos
                    ? <div className="mt-1 w-fit rounded-full bg-brand/10 px-2.5 py-0.5 text-sm font-bold text-brand-ink">{textoDistancia(km(pos, e))} de você</div>
                    : <button onClick={() => { setErroLocal(''); pedirLocalizacao().then(() => clique('perto-de-mim')).catch((x) => setErroLocal(x.message)) }} className="link-toque -my-2 text-sm font-semibold text-brand-ink underline underline-offset-2">Ver a distância de você</button>)}
                  {erroLocal && <div className="mt-1 text-xs text-danger">{erroLocal}</div>}</dd></div>
              <div className="flex gap-3"><dt aria-label="Valor"><Ticket className="size-5 text-brand-ink" /></dt>
                <dd>{e.gratuito ? <b>Entrada gratuita</b> : <b>{e.preco || 'Valor a confirmar'}</b>}</dd></div>
              {e.instagram && (
                <div className="flex gap-3"><dt aria-label="Instagram"><Instagram className="size-5 text-brand-ink" /></dt>
                  <dd><a className="font-semibold text-brand-ink" target="_blank" rel="noreferrer"
                    onClick={() => clique('instagram', e.id)} href={`https://instagram.com/${e.instagram.replace(/^@/, '')}`}>@{e.instagram.replace(/^@/, '')}</a></dd></div>
              )}
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => presenca('vou')} aria-pressed={minha === 'vou'}
                className={`btn h-12 text-sm ${minha === 'vou' ? 'bg-accent text-on-accent' : 'border border-line bg-surface text-ink hover:bg-surface-2'}`}>
                <PartyPopper className="size-5" aria-hidden /> Eu vou{contagem.vou ? <span className="tabular-nums opacity-80"> · {contagem.vou}</span> : ''}
              </button>
              <button onClick={() => presenca('interesse')} aria-pressed={minha === 'interesse'}
                className={`btn h-12 text-sm ${minha === 'interesse' ? 'bg-brand text-on-brand' : 'border border-line bg-surface text-ink hover:bg-surface-2'}`}>
                <Star className="size-5" aria-hidden /> <span className="sm:hidden">Interesse</span><span className="hidden sm:inline">Tenho interesse</span>{contagem.interesse ? <span className="tabular-nums opacity-80"> · {contagem.interesse}</span> : ''}
              </button>
            </div>
            {RANKING_LIGADO && janelaCheckin(e) && (
              <div className="mt-2 rounded-2xl border-2 border-brand bg-brand/10 p-3">
                {checkin.feito ? (
                  <p className="flex flex-wrap items-center gap-x-2 font-semibold"><MapPinCheck className="size-5 text-brand-ink" aria-hidden /> Você está no rolê! Contou no ranking do mês.
                    <Link to="/ranking" className="font-bold text-brand-ink underline underline-offset-2">Ver ranking</Link></p>
                ) : (<>
                  <button onClick={toAqui} disabled={checkin.carregando} className="btn-brand w-full py-3"><MapPinCheck className="size-5" aria-hidden /> {checkin.carregando ? 'Conferindo onde você está…' : 'Tô aqui'}</button>
                  <p className="mt-1.5 text-xs text-muted">Toque quando chegar no local. Cada rolê vale 1 ponto no <Link to="/ranking" className="font-semibold text-brand-ink underline underline-offset-2">ranking do mês</Link>.</p>
                  {checkin.erro && <p role="alert" className="mt-1 text-sm font-semibold text-danger">{checkin.erro}{!user && <> <button onClick={() => import('../lib/auth').then((m) => m.entrarComGoogle()).catch((x) => setCheckin((c) => ({ ...c, erro: x.message })))} className="underline underline-offset-2">Entrar</button></>}</p>}
                </>)}
              </div>
            )}
            {minha === 'vou' && e.inicio > new Date(Date.now() - 4 * 3600000) && (
              <a onClick={() => clique('chamar-galera', e.id)} target="_blank" rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`Bora? Eu vou no ${e.titulo}, ${rotuloDia(e.inicio).toLowerCase().replace(' · ', ', ')} ${asHora(e)}${e.localNome ? ` no ${e.localNome}` : ''}.\n${url}?o=galera`)}`}
                className="btn mt-2 w-full border-2 border-accent bg-accent/15 py-3 text-ink hover:bg-accent/25">
                <MessageCircle className="size-5" aria-hidden /> Chamar a galera no WhatsApp
              </a>
            )}
            {aviso && (
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted">{aviso}
                <button onClick={() => import('../lib/auth').then((m) => m.entrarComGoogle()).then(() => setAviso('')).catch((x) => setAviso(x.message))} className="font-semibold text-brand-ink underline underline-offset-2">Entrar</button></p>
            )}
            {!user && !aviso && (
              <p className="mt-3 text-sm text-muted">
                <button onClick={() => import('../lib/auth').then((m) => m.entrarComGoogle()).catch((x) => setAviso(x.message))} className="font-semibold text-brand-ink underline underline-offset-2">Faça login</button> para conferir quem vai no evento.
              </p>
            )}
            {user && rostos.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {rostos.slice(0, 8).map((u) => (
                    <Link key={u.uid} to={`/u/${u.uid}`} title={u.nome} className="relative block size-8 overflow-hidden rounded-full bg-surface-2 ring-2 ring-bg hover:z-10">
                      {u.foto ? <img src={u.foto} alt={u.nome} referrerPolicy="no-referrer" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-xs font-bold">{u.nome?.[0]}</span>}
                    </Link>
                  ))}
                </div>
                <span className="text-sm text-muted">{rostos.length === 1 ? `${rostos[0].nome.split(' ')[0]} vai` : `${rostos[0].nome.split(' ')[0]} e mais ${rostos.length - 1} vão`}</span>
              </div>
            )}
            {lembrete.suporte && lembrete.suporte !== 'nao-suporta' && e.inicio > new Date() && (
              <>
                <button onClick={alternarLembrete} disabled={lembrete.carregando} aria-pressed={lembrete.ligado}
                  className={`btn mt-2 w-full py-3 ${lembrete.ligado ? 'bg-brand/10 text-brand-ink' : 'border border-line bg-surface text-ink hover:bg-surface-2'}`}>
                  {lembrete.carregando ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : lembrete.ligado ? <BellRing className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
                  {lembrete.ligado ? 'Lembrete ativado · tocar para tirar' : 'Me lembrar no celular'}
                </button>
                <p className="mt-1 text-xs text-muted">{lembrete.suporte === 'ios-instalar' ? 'No iPhone, o lembrete funciona com o app instalado na tela de início.' : 'Você recebe um aviso umas 3 horas antes de começar.'}</p>
                {lembrete.erro && <p className="mt-1 text-xs text-danger">{lembrete.erro}</p>}
              </>
            )}

            {e.ingressoUrl && (
              <a onClick={() => clique('ingresso', e.id)} href={e.ingressoUrl} target="_blank" rel="noreferrer" className="btn-accent mt-4 w-full py-3.5 text-lg"><Ticket className="size-5" /> Comprar ingresso</a>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="relative">
                <button onClick={() => setAgendaAberta((v) => !v)} aria-expanded={agendaAberta} className={`acao-evento ${agendaAberta ? 'acao-evento-on' : ''}`}><CalendarPlus className="size-5" aria-hidden /><span>Agenda</span></button>
                {agendaAberta && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                    <a onClick={() => clique('agenda', e.id)} className="block px-4 py-3 hover:bg-surface-2" target="_blank" rel="noreferrer" href={linkGoogleAgenda(e, url)}>Google Agenda (Android)</a>
                    <button className="block w-full px-4 py-3 text-left hover:bg-surface-2" onClick={() => { clique('agenda', e.id); baixarIcs(e, url); setAgendaAberta(false) }}>iPhone / outro app (.ics)</button>
                  </div>
                )}
              </div>
              <button onClick={compartilhar} className="acao-evento">{copiado ? <><Check className="size-5 text-brand-ink" aria-hidden /><span>Copiado</span></> : <><Share2 className="size-5" aria-hidden /><span>Compartilhar</span></>}</button>
              <button onClick={async () => { clique('story', e.id); setStory('Gerando…'); const r = await gerarStory(e); setStory(r === 'baixado' ? 'Salva!' : '') }}
                className="acao-evento"><ImageDown className="size-5" aria-hidden /><span>{story || 'Story'}</span></button>
            </div>

            <Programacao evento={e} />
            {e.descricao && <p className="mt-6 whitespace-pre-line leading-relaxed">{e.descricao}</p>}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl uppercase">Como chegar</h2>
          {temMapa ? (
            <Suspense fallback={<div className="h-72 w-full animate-pulse rounded-2xl bg-surface-2" />}><MapaVer lat={e.lat} lng={e.lng} className="h-72 w-full" /></Suspense>
          ) : (
            <p className="rounded-2xl border border-dashed border-line p-4 text-muted">Mapa indisponível para este endereço.</p>
          )}
          <a onClick={() => clique('rota', e.id)} href={linkComoChegar(e)} target="_blank" rel="noreferrer" className="btn-ghost mt-3"><Navigation className="size-5" /> Abrir rota no Google Maps</a>
        </section>
      </main>
      <Rodape />
    </>
  )
}
