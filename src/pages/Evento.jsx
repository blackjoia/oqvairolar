import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Topo from '../components/Topo'
import Cartaz from '../components/Cartaz'
import { Rodape } from './Inicio'
import { buscarEvento, slugify } from '../lib/eventos'
import { rotuloDia, hora } from '../lib/datas'
import { categoria } from '../lib/constantes'
import { linkGoogleAgenda, baixarIcs, linkComoChegar } from '../lib/agenda'
import { useAuth } from '../lib/auth'
import MapaVer from '../components/MapaVer'
import { gerarStory } from '../lib/story'
import { clique } from '../lib/visitas'
import { km, textoDistancia, useMinhaPosicao, pedirLocalizacao } from '../lib/distancia'
import { minhaPresenca, contarPresencas, marcarPresenca } from '../lib/presenca'
import { CalendarDays, MapPin, Ticket, Instagram, CalendarPlus, Share2, Check, Navigation, ImageDown, ArrowLeft, PartyPopper, Star } from 'lucide-react'

export default function Evento() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [e, setE] = useState(undefined)
  const pos = useMinhaPosicao()
  const [erroLocal, setErroLocal] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [agendaAberta, setAgendaAberta] = useState(false)
  const [story, setStory] = useState('')
  const [minha, setMinha] = useState(null)
  const [contagem, setContagem] = useState({ vou: 0, interesse: 0 })
  useEffect(() => {
    if (id.endsWith('-demo')) return
    minhaPresenca(id).then(setMinha); contarPresencas(id).then(setContagem)
  }, [id])
  const presenca = async (tipo) => {
    const novo = minha === tipo ? null : tipo
    setContagem((c) => ({ ...c, ...(minha ? { [minha]: Math.max(0, c[minha] - 1) } : {}), ...(novo ? { [novo]: (minha === novo ? c[novo] : c[novo] + 1) } : {}) }))
    setMinha(novo)
    try { await marcarPresenca(id, novo) } catch { /* sem internet: fica só local */ }
  }

  useEffect(() => {
    buscarEvento(id).then(setE).catch(() => setE(null))
  }, [id, isAdmin])

  useEffect(() => {
    if (e) document.title = `${e.titulo} · O Que Vai Rolar?`
    return () => { document.title = 'O Que Vai Rolar? · Agenda de Francisco Beltrão e região' }
  }, [e])

  if (e === undefined) return (<><Topo /><div className="mx-auto mt-8 h-96 max-w-3xl animate-pulse rounded-2xl bg-surface-2 px-4" /></>)
  if (!e) return (
    <><Topo />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-4xl uppercase">Evento não encontrado</p>
        <p className="mt-2 text-muted">Pode ter sido removido ou o link está errado.</p>
        <Link to="/" className="btn-brand mt-6">Ver a agenda</Link>
      </main></>
  )

  const url = `${location.origin}/evento/${e.id}`
  const cat = categoria(e.categoria)
  const compartilhar = async () => {
    clique('compartilhar', e.id)
    const dados = { title: e.titulo, text: `${e.titulo}\n${rotuloDia(e.inicio)} às ${hora(e.inicio)} · ${[e.localNome, e.cidade].filter(Boolean).join(', ')}`, url: url + '?o=compartilhado' }
    if (navigator.share) { try { await navigator.share(dados) } catch {} return }
    await navigator.clipboard.writeText(url + '?o=compartilhado'); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  const temMapa = e.lat && e.lng

  return (
    <>
      <Topo>{isAdmin ? <Link to={`/admin/evento/${e.id}`} className="btn-ghost py-2 text-sm">Editar</Link> : undefined}</Topo>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft className="size-4" /> Agenda</Link>
        {e.status !== 'publicado' && (
          <p className="mt-3 rounded-xl bg-amber-400/20 p-3 text-sm font-semibold">Este evento está como "{e.status}" e só você (admin) consegue ver.</p>
        )}
        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Cartaz evento={e} className="aspect-[4/5] w-full rounded-2xl border border-line md:sticky md:top-24" />

          <div>
            <span className="inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              <cat.Icone className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />{cat.nome}
            </span>
            <h1 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">{e.titulo}</h1>
            {!!e.atracoes?.length && (
              <p className="mt-3 text-lg font-semibold">Com {e.atracoes.map((a, i) => (
                <span key={a}>{i > 0 && (i === e.atracoes.length - 1 ? ' e ' : ', ')}
                  {a.startsWith('@')
                    ? <a className="text-brand" target="_blank" rel="noreferrer" onClick={() => clique('instagram', e.id)} href={`https://instagram.com/${a.slice(1)}`}>{a}</a>
                    : <Link className="text-brand" to={`/local/${slugify(a)}`}>{a}</Link>}
                </span>))}</p>
            )}
            {!!e.generos?.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.generos.map((g) => <Link key={g} to={`/?genero=${encodeURIComponent(g)}`} className="rounded-full border border-line px-2.5 py-0.5 text-sm font-semibold text-muted hover:border-brand hover:text-brand">{g}</Link>)}
              </div>
            )}

            <dl className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex gap-3"><dt aria-label="Quando"><CalendarDays className="size-5 text-brand" /></dt>
                <dd><b>{rotuloDia(e.inicio)}</b>, às {hora(e.inicio)}{e.fim ? ` até ${hora(e.fim)}` : ''}</dd></div>
              <div className="flex gap-3"><dt aria-label="Onde"><MapPin className="size-5 text-brand" /></dt>
                <dd>{e.localNome ? <Link to={`/local/${slugify(e.localNome)}`} className="font-bold hover:text-brand">{e.localNome}</Link> : <b>Local a confirmar</b>}
                  <div className="text-sm text-muted">{[e.endereco, e.cidade].filter(Boolean).join(' · ')}</div>
                  {km({ lat: 0, lng: 0 }, e) != null && (pos
                    ? <div className="mt-1 w-fit rounded-full bg-brand/10 px-2.5 py-0.5 text-sm font-bold text-brand">{textoDistancia(km(pos, e))} de você</div>
                    : <button onClick={() => { setErroLocal(''); pedirLocalizacao().then(() => clique('perto-de-mim')).catch((x) => setErroLocal(x.message)) }} className="mt-1 text-sm font-semibold text-brand underline underline-offset-2">Ver a distância de você</button>)}
                  {erroLocal && <div className="mt-1 text-xs text-danger">{erroLocal}</div>}</dd></div>
              <div className="flex gap-3"><dt aria-label="Valor"><Ticket className="size-5 text-brand" /></dt>
                <dd>{e.gratuito ? <b>Entrada gratuita</b> : <b>{e.preco || 'Valor a confirmar'}</b>}</dd></div>
              {e.instagram && (
                <div className="flex gap-3"><dt aria-label="Instagram"><Instagram className="size-5 text-brand" /></dt>
                  <dd><a className="font-semibold text-brand" target="_blank" rel="noreferrer"
                    onClick={() => clique('instagram', e.id)} href={`https://instagram.com/${e.instagram.replace(/^@/, '')}`}>@{e.instagram.replace(/^@/, '')}</a></dd></div>
              )}
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => presenca('vou')} aria-pressed={minha === 'vou'}
                className={`btn py-3 ${minha === 'vou' ? 'bg-accent text-on-accent' : 'border border-line bg-surface text-ink hover:bg-surface-2'}`}>
                <PartyPopper className="size-5" aria-hidden /> Eu vou{contagem.vou ? <span className="tabular-nums opacity-80"> · {contagem.vou}</span> : ''}
              </button>
              <button onClick={() => presenca('interesse')} aria-pressed={minha === 'interesse'}
                className={`btn py-3 ${minha === 'interesse' ? 'bg-brand text-on-brand' : 'border border-line bg-surface text-ink hover:bg-surface-2'}`}>
                <Star className="size-5" aria-hidden /> Tenho interesse{contagem.interesse ? <span className="tabular-nums opacity-80"> · {contagem.interesse}</span> : ''}
              </button>
            </div>
            {(contagem.vou + contagem.interesse) >= 3 && (
              <p className="mt-2 text-sm font-semibold text-brand">{contagem.vou ? `${contagem.vou} ${contagem.vou === 1 ? 'pessoa vai' : 'pessoas vão'}` : ''}{contagem.vou && contagem.interesse ? ' e ' : ''}{contagem.interesse ? `${contagem.interesse} com interesse` : ''}</p>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {e.ingressoUrl && (
                <a onClick={() => clique('ingresso', e.id)} href={e.ingressoUrl} target="_blank" rel="noreferrer" className="btn-accent sm:col-span-2 py-3 text-lg"><Ticket className="size-5" /> Comprar ingresso</a>
              )}
              <div className="relative">
                <button onClick={() => setAgendaAberta((v) => !v)} className="btn-brand w-full"><CalendarPlus className="size-5" /> Adicionar à agenda</button>
                {agendaAberta && (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                    <a onClick={() => clique('agenda', e.id)} className="block px-4 py-3 hover:bg-surface-2" target="_blank" rel="noreferrer" href={linkGoogleAgenda(e, url)}>Google Agenda (Android)</a>
                    <button className="block w-full px-4 py-3 text-left hover:bg-surface-2" onClick={() => { clique('agenda', e.id); baixarIcs(e, url); setAgendaAberta(false) }}>iPhone / outro app (.ics)</button>
                  </div>
                )}
              </div>
              <button onClick={compartilhar} className="btn-ghost">{copiado ? <><Check className="size-5 text-brand" /> Link copiado</> : <><Share2 className="size-5" /> Compartilhar</>}</button>
              <button onClick={async () => { clique('story', e.id); setStory('Gerando…'); const r = await gerarStory(e); setStory(r === 'baixado' ? 'Arte salva! Poste no seu Story.' : '') }}
                className="btn-ghost sm:col-span-2"><ImageDown className="size-5" /> {story || 'Arte para o Story'}</button>
            </div>

            {e.descricao && <p className="mt-6 whitespace-pre-line leading-relaxed">{e.descricao}</p>}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl uppercase">Como chegar</h2>
          {temMapa ? (
            <MapaVer lat={e.lat} lng={e.lng} className="h-72 w-full" />
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
