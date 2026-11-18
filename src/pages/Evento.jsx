import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Topo from '../components/Topo'
import Cartaz from '../components/Cartaz'
import { Rodape } from './Inicio'
import { buscarEvento } from '../lib/eventos'
import { rotuloDia, hora } from '../lib/datas'
import { categoria } from '../lib/constantes'
import { linkGoogleAgenda, baixarIcs, linkComoChegar } from '../lib/agenda'
import { useAuth } from '../lib/auth'
import MapaVer from '../components/MapaVer'
import { gerarStory } from '../lib/story'
import { CalendarDays, MapPin, Ticket, Instagram, CalendarPlus, Share2, Check, Navigation, ImageDown, ArrowLeft } from 'lucide-react'

export default function Evento() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [e, setE] = useState(undefined)
  const [copiado, setCopiado] = useState(false)
  const [agendaAberta, setAgendaAberta] = useState(false)
  const [story, setStory] = useState('')

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
    const dados = { title: e.titulo, text: `${e.titulo}\n${rotuloDia(e.inicio)} às ${hora(e.inicio)} · ${[e.localNome, e.cidade].filter(Boolean).join(', ')}`, url }
    if (navigator.share) { try { await navigator.share(dados) } catch {} return }
    await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }
  const temMapa = e.lat && e.lng

  return (
    <>
      <Topo>{isAdmin && <Link to={`/admin/evento/${e.id}`} className="btn-ghost py-2 text-sm">Editar</Link>}</Topo>
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
            {!!e.generos?.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.generos.map((g) => <Link key={g} to={`/?genero=${encodeURIComponent(g)}`} className="rounded-full border border-line px-2.5 py-0.5 text-sm font-semibold text-muted hover:border-brand hover:text-brand">{g}</Link>)}
              </div>
            )}

            <dl className="mt-5 space-y-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex gap-3"><dt aria-label="Quando"><CalendarDays className="size-5 text-brand" /></dt>
                <dd><b>{rotuloDia(e.inicio)}</b>, às {hora(e.inicio)}{e.fim ? ` até ${hora(e.fim)}` : ''}</dd></div>
              <div className="flex gap-3"><dt aria-label="Onde"><MapPin className="size-5 text-brand" /></dt>
                <dd><b>{e.localNome || 'Local a confirmar'}</b>
                  <div className="text-sm text-muted">{[e.endereco, e.cidade].filter(Boolean).join(' · ')}</div></dd></div>
              <div className="flex gap-3"><dt aria-label="Valor"><Ticket className="size-5 text-brand" /></dt>
                <dd>{e.gratuito ? <b>Entrada gratuita</b> : <b>{e.preco || 'Valor a confirmar'}</b>}</dd></div>
              {e.instagram && (
                <div className="flex gap-3"><dt aria-label="Instagram"><Instagram className="size-5 text-brand" /></dt>
                  <dd><a className="font-semibold text-brand" target="_blank" rel="noreferrer"
                    href={`https://instagram.com/${e.instagram.replace(/^@/, '')}`}>@{e.instagram.replace(/^@/, '')}</a></dd></div>
              )}
            </dl>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {e.ingressoUrl && (
                <a href={e.ingressoUrl} target="_blank" rel="noreferrer" className="btn-accent sm:col-span-2 py-3 text-lg"><Ticket className="size-5" /> Comprar ingresso</a>
              )}
              <div className="relative">
                <button onClick={() => setAgendaAberta((v) => !v)} className="btn-brand w-full"><CalendarPlus className="size-5" /> Adicionar à agenda</button>
                {agendaAberta && (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                    <a className="block px-4 py-3 hover:bg-surface-2" target="_blank" rel="noreferrer" href={linkGoogleAgenda(e, url)}>Google Agenda (Android)</a>
                    <button className="block w-full px-4 py-3 text-left hover:bg-surface-2" onClick={() => { baixarIcs(e, url); setAgendaAberta(false) }}>iPhone / outro app (.ics)</button>
                  </div>
                )}
              </div>
              <button onClick={compartilhar} className="btn-ghost">{copiado ? <><Check className="size-5 text-brand" /> Link copiado</> : <><Share2 className="size-5" /> Compartilhar</>}</button>
              <button onClick={async () => { setStory('Gerando…'); const r = await gerarStory(e); setStory(r === 'baixado' ? 'Arte salva! Poste no seu Story.' : '') }}
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
          <a href={linkComoChegar(e)} target="_blank" rel="noreferrer" className="btn-ghost mt-3"><Navigation className="size-5" /> Abrir rota no Google Maps</a>
        </section>
      </main>
      <Rodape />
    </>
  )
}
