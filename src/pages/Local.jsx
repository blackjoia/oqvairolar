import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
// O mapa (Leaflet) só carrega quando a página precisa dele.
const MapaVer = lazy(() => import('../components/MapaVer'))
import { Rodape } from './Inicio'
import PaginaOficial from '../components/PaginaOficial'
import RankingLocal from '../components/RankingLocal'
import { listarPublicados, listarAnteriores, slugify } from '../lib/eventos'
import { linkComoChegar } from '../lib/agenda'
import { ArrowLeft, MapPin, Instagram, Share2, Check, CalendarX2, Navigation, Mic2, History } from 'lucide-react'

// Página de um local (bar, espaço) ou de quem se apresenta/organiza (banda, DJ, produtora).
// Junta todos os eventos publicados ligados a esse nome.
export default function Local() {
  const { slug } = useParams()
  const [eventos, setEventos] = useState(null)
  const [anteriores, setAnteriores] = useState([])
  const [verTudo, setVerTudo] = useState(false)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { listarPublicados().then(setEventos).catch(() => setEventos([])) }, [])
  useEffect(() => { listarAnteriores().then(setAnteriores).catch(() => setAnteriores([])) }, [])

  const dados = useMemo(() => {
    if (!eventos) return null
    const ligado = (lista) => ({
      comoLocal: lista.filter((e) => slugify(e.localNome) === slug),
      comoAtracao: lista.filter((e) => (e.atracoes || []).some((a) => slugify(a) === slug) || slugify(e.instagram) === slug),
    })
    const futuros = ligado(eventos), passados = ligado(anteriores)
    // Um evento geral (ex.: Festa na Vila) não conta como show quando já tem o show da banda separado.
    const paisComShows = new Set([...eventos, ...anteriores].map((e) => e.pai).filter(Boolean))
    const comoLocal = [...futuros.comoLocal, ...passados.comoLocal]
    const comoAtracao = [...futuros.comoAtracao, ...passados.comoAtracao]
    const historico = [...new Map([...passados.comoLocal, ...passados.comoAtracao].map((e) => [e.id, e])).values()]
      .filter((e) => !paisComShows.has(e.id)).sort((a, b) => b.inicio - a.inicio)
    const todos = [...new Map([...futuros.comoLocal, ...futuros.comoAtracao].map((e) => [e.id, e])).values()].sort((a, b) => a.inicio - b.inicio)
    const agora = new Date()
    const proximos = todos.filter((e) => (e.fim || new Date(e.inicio.getTime() + 6 * 3600000)) > agora)
    const ref = comoLocal[0]
    const nome = ref?.localNome || comoAtracao[0]?.atracoes?.find((a) => slugify(a) === slug) || (comoAtracao[0] && '@' + comoAtracao[0].instagram) || slug.replace(/-/g, ' ')
    const insta = (nome.startsWith('@') ? nome.slice(1) : null) || (ref && comoLocal.find((e) => e.instagram && slugify(e.instagram) === slug)?.instagram)
    const comMapa = comoLocal.find((e) => e.lat && e.lng)
    const comShows = [...historico, ...proximos.filter((e) => !paisComShows.has(e.id))]
    const numeros = {
      shows: new Set(comShows.map((e) => e.id)).size,
      cidades: new Set(comShows.map((e) => e.cidade).filter(Boolean)).size,
      palcos: new Set(comShows.map((e) => e.localNome).filter(Boolean)).size,
      desde: comShows.length ? new Date(Math.min(...comShows.map((e) => +e.inicio))) : null,
    }
    return { nome, ehLocal: comoLocal.length > 0, ref, proximos, insta, comMapa, historico, numeros }
  }, [eventos, anteriores, slug])

  useEffect(() => {
    if (dados?.nome) document.title = `${dados.nome} · O Que Vai Rolar?`
    return () => { document.title = 'O Que Vai Rolar? · Agenda do Sudoeste do Paraná' }
  }, [dados])

  const compartilhar = async () => {
    const url = `${location.origin}/local/${slug}?o=compartilhado`
    if (navigator.share) { try { await navigator.share({ title: dados.nome, text: `Agenda de ${dados.nome} no O Que Vai Rolar?`, url }) } catch {} return }
    await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <>
      <Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-16 pt-4">
        <Link to="/" className="link-toque -my-2 gap-1 text-sm font-semibold text-brand-ink"><ArrowLeft className="size-4" aria-hidden /> Agenda</Link>
        {!dados && <div className="mt-6 h-40 animate-pulse rounded-2xl bg-surface-2" />}
        {dados && (<>
          <section className="mt-4 rounded-3xl border border-line bg-surface p-5 sm:p-7">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-ink">
              {dados.ehLocal ? <><MapPin className="size-3.5" aria-hidden /> Local</> : <><Mic2 className="size-3.5" aria-hidden /> Atração</>}
            </span>
            <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">{dados.nome}</h1>
            {dados.ref && <p className="mt-2 text-muted">{[dados.ref.endereco, dados.ref.cidade].filter(Boolean).join(' · ')}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {dados.insta && <a href={`https://instagram.com/${dados.insta.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="btn-ghost"><Instagram className="size-5" /> @{dados.insta.replace(/^@/, '')}</a>}
              {dados.comMapa && <a href={linkComoChegar(dados.comMapa)} target="_blank" rel="noreferrer" className="btn-ghost"><Navigation className="size-5" /> Como chegar</a>}
              <button onClick={compartilhar} className="btn-ghost">{copiado ? <><Check className="size-5" /> Link copiado</> : <><Share2 className="size-5" /> Compartilhar agenda</>}</button>
            </div>
            {!dados.ehLocal && dados.numeros.shows > 1 && (
              <dl className="mt-5 grid grid-cols-3 gap-2">
                {[['Shows', dados.numeros.shows], ['Cidades', dados.numeros.cidades], ['Palcos', dados.numeros.palcos]].map(([r, v]) => (
                  <div key={r} className="rounded-2xl bg-surface-2 px-3 py-3 text-center">
                    <dd className="font-display text-4xl leading-none tabular-nums text-brand-ink">{v}</dd>
                    <dt className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">{r}</dt>
                  </div>
                ))}
              </dl>
            )}
            <PaginaOficial slug={slug} nome={dados.nome} tipo={dados.ehLocal ? 'local' : 'atracao'} />
          </section>

          {dados.ehLocal && <RankingLocal slug={slug} nome={dados.nome} />}

          <h2 className="mt-8 font-display text-3xl uppercase">Próximos eventos <span className="text-muted">{dados.proximos.length}</span></h2>
          {dados.proximos.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-line p-8 text-center">
              <CalendarX2 className="mx-auto mb-2 size-10 text-brand-ink" aria-hidden />
              <p className="font-display text-2xl uppercase">Nada marcado por enquanto</p>
              <Link to="/divulgar" className="btn-accent mt-4">Divulgar um evento</Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 min-[540px]:grid-cols-3 md:grid-cols-4">{dados.proximos.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
          )}
          {dados.historico.length > 0 && (<>
            <h2 className="mt-10 flex items-center gap-2 font-display text-3xl uppercase"><History className="size-7 text-brand-ink" aria-hidden /> {dados.ehLocal ? 'Já rolou aqui' : 'Histórico de shows'} <span className="text-muted">{dados.historico.length}</span></h2>
            {dados.numeros.desde && <p className="mt-1 text-sm text-muted">No O Que Vai Rolar desde {dados.numeros.desde.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</p>}
            <ol className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {(verTudo ? dados.historico : dados.historico.slice(0, 6)).map((e) => (
                <li key={e.id}><Link to={`/evento/${e.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2">
                  <span className="w-14 shrink-0 text-center"><span className="block font-display text-2xl leading-none">{e.inicio.getDate()}</span><span className="text-xs font-bold uppercase text-muted">{e.inicio.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')} {String(e.inicio.getFullYear()).slice(2)}</span></span>
                  <span className="min-w-0"><span className="block truncate font-bold">{e.titulo}</span><span className="block truncate text-sm text-muted">{[e.localNome, e.cidade].filter(Boolean).join(' · ')}</span></span>
                </Link></li>
              ))}
            </ol>
            {!verTudo && dados.historico.length > 6 && <button onClick={() => setVerTudo(true)} className="btn-ghost mt-3">Ver todos os {dados.historico.length} shows</button>}
          </>)}
          {dados.comMapa && <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-2xl bg-surface-2" />}><MapaVer lat={dados.comMapa.lat} lng={dados.comMapa.lng} className="mt-8 h-64" /></Suspense>}
        </>)}
      </main>
      <Rodape />
    </>
  )
}
