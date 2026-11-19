import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import MapaVer from '../components/MapaVer'
import { Rodape } from './Inicio'
import PaginaOficial from '../components/PaginaOficial'
import { listarPublicados, slugify } from '../lib/eventos'
import { linkComoChegar } from '../lib/agenda'
import { ArrowLeft, MapPin, Instagram, Share2, Check, CalendarX2, Navigation, Mic2 } from 'lucide-react'

// Página de um local (bar, espaço) ou de quem se apresenta/organiza (banda, DJ, produtora).
// Junta todos os eventos publicados ligados a esse nome.
export default function Local() {
  const { slug } = useParams()
  const [eventos, setEventos] = useState(null)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { listarPublicados().then(setEventos).catch(() => setEventos([])) }, [])

  const dados = useMemo(() => {
    if (!eventos) return null
    const comoLocal = eventos.filter((e) => slugify(e.localNome) === slug)
    const comoAtracao = eventos.filter((e) => (e.atracoes || []).some((a) => slugify(a) === slug) || slugify(e.instagram) === slug)
    const todos = [...new Map([...comoLocal, ...comoAtracao].map((e) => [e.id, e])).values()].sort((a, b) => a.inicio - b.inicio)
    const agora = new Date()
    const proximos = todos.filter((e) => (e.fim || new Date(e.inicio.getTime() + 6 * 3600000)) > agora)
    const ref = comoLocal[0]
    const nome = ref?.localNome || comoAtracao[0]?.atracoes?.find((a) => slugify(a) === slug) || (comoAtracao[0] && '@' + comoAtracao[0].instagram) || slug
    const insta = (nome.startsWith('@') ? nome.slice(1) : null) || (ref && comoLocal.find((e) => e.instagram && slugify(e.instagram) === slug)?.instagram)
    const comMapa = comoLocal.find((e) => e.lat && e.lng)
    return { nome, ehLocal: comoLocal.length > 0, ref, proximos, insta, comMapa }
  }, [eventos, slug])

  useEffect(() => {
    if (dados?.nome) document.title = `${dados.nome} · O Que Vai Rolar?`
    return () => { document.title = 'O Que Vai Rolar? · Agenda de Francisco Beltrão e região' }
  }, [dados])

  const compartilhar = async () => {
    const url = `${location.origin}/local/${slug}?o=compartilhado`
    if (navigator.share) { try { await navigator.share({ title: dados.nome, text: `Agenda de ${dados.nome} no O Que Vai Rolar?`, url }) } catch {} return }
    await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <>
      <Topo />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft className="size-4" /> Agenda</Link>
        {!dados && <div className="mt-6 h-40 animate-pulse rounded-2xl bg-surface-2" />}
        {dados && (<>
          <section className="mt-4 rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
              {dados.ehLocal ? <><MapPin className="size-3.5" aria-hidden /> Local</> : <><Mic2 className="size-3.5" aria-hidden /> Atração</>}
            </span>
            <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">{dados.nome}</h1>
            {dados.ref && <p className="mt-2 text-muted">{[dados.ref.endereco, dados.ref.cidade].filter(Boolean).join(' · ')}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {dados.insta && <a href={`https://instagram.com/${dados.insta.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="btn-ghost"><Instagram className="size-5" /> @{dados.insta.replace(/^@/, '')}</a>}
              {dados.comMapa && <a href={linkComoChegar(dados.comMapa)} target="_blank" rel="noreferrer" className="btn-ghost"><Navigation className="size-5" /> Como chegar</a>}
              <button onClick={compartilhar} className="btn-ghost">{copiado ? <><Check className="size-5" /> Link copiado</> : <><Share2 className="size-5" /> Compartilhar agenda</>}</button>
            </div>
            <PaginaOficial slug={slug} nome={dados.nome} tipo={dados.ehLocal ? 'local' : 'atracao'} />
          </section>

          <h2 className="mt-8 font-display text-3xl uppercase">Próximos eventos <span className="text-muted">{dados.proximos.length}</span></h2>
          {dados.proximos.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line p-8 text-center">
              <CalendarX2 className="mx-auto mb-2 size-10 text-brand" aria-hidden />
              <p className="font-display text-2xl uppercase">Nada marcado por enquanto</p>
              <Link to="/divulgar" className="btn-accent mt-4">Divulgar um evento</Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{dados.proximos.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
          )}
          {dados.comMapa && <MapaVer lat={dados.comMapa.lat} lng={dados.comMapa.lng} className="mt-8 h-64" />}
        </>)}
      </main>
      <Rodape />
    </>
  )
}
