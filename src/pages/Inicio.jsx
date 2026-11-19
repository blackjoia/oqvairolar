import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import Logo from '../components/Logo'
import Deslizar from '../components/Deslizar'
import Segmentado from '../components/Segmentado'
import AbasCategoria from '../components/AbasCategoria'
import { abrirInstalar } from '../components/InstalarApp'
import { listarPublicados } from '../lib/eventos'
import { faixaDia, rotuloDia, chaveDia } from '../lib/datas'
import { CATEGORIAS } from '../lib/constantes'
import { filtro, clique } from '../lib/visitas'
import { normalizar } from '../lib/parecidos'
import { km, useMinhaPosicao, pedirLocalizacao, esquecerLocalizacao } from '../lib/distancia'
import { SlidersHorizontal, X, CalendarX2, ChevronDown, Search, Navigation, LoaderCircle, ArrowRight } from 'lucide-react'

const DIAS = [
  { id: 'todos', nome: 'Tudo' },
  { id: 'hoje', nome: 'Hoje' },
  { id: 'amanha', nome: 'Amanhã' },
  { id: 'fds', nome: 'Fim de semana', curto: 'Fim de semana' },
  { id: 'semana', nome: 'Próximos 7 dias', curto: '7 dias' },
]

const RAIO_MAX = 250

export default function Inicio() {
  const [eventos, setEventos] = useState(null)
  const [erro, setErro] = useState('')
  const [gaveta, setGaveta] = useState(false)
  const pos = useMinhaPosicao()
  const [buscandoLocal, setBuscandoLocal] = useState(false)
  const [erroLocal, setErroLocal] = useState('')
  async function pertoDeMim() {
    setErroLocal('')
    if (pos) { esquecerLocalizacao(); return }
    setBuscandoLocal(true)
    try { await pedirLocalizacao(); clique('perto-de-mim') } catch (x) { setErroLocal(x.message) } finally { setBuscandoLocal(false) }
  }
  const [params, setParams] = useSearchParams()
  const raio = Number(params.get('raio')) || 0
  const [raioTela, setRaioTela] = useState(raio || RAIO_MAX)
  useEffect(() => {
    const t = setTimeout(() => {
      const v = raioTela >= RAIO_MAX ? 0 : raioTela
      if (v === raio) return
      const p = new URLSearchParams(params); if (v) p.set('raio', String(v)); else p.delete('raio')
      setParams(p, { replace: true }); if (v) filtro('raio', String(v))
    }, 150)
    return () => clearTimeout(t)
  }, [raioTela]) // eslint-disable-line react-hooks/exhaustive-deps
  const dia = params.get('dia') || 'todos'
  const cidade = params.get('cidade') || ''
  const genero = params.get('genero') || ''
  const cat = params.get('categoria') || ''
  const busca = params.get('q') || ''

  const setFiltro = (k, v) => {
    const p = new URLSearchParams(params)
    if (!v || v === 'todos') p.delete(k); else { p.set(k, v); filtro(k, v) }
    setParams(p, { replace: true })
  }

  useEffect(() => {
    listarPublicados().then(setEventos).catch((e) => { console.error(e); setErro('Não deu para carregar a agenda agora. Tente de novo em instantes.') })
  }, [])

  const agora = new Date()
  const futuros = useMemo(() => (eventos || []).filter((e) => (e.fim || new Date(e.inicio.getTime() + 6 * 3600000)) > agora), [eventos])

  const cidades = useMemo(() => [...new Set(futuros.map((e) => e.cidade).filter(Boolean))].sort(), [futuros])
  const generos = useMemo(() => [...new Set(futuros.flatMap((e) => e.generos || []))].sort(), [futuros])

  const termos = useMemo(() => normalizar(busca).split(/\s+/).filter(Boolean), [busca])
  const [textoBusca, setTextoBusca] = useState(busca)
  useEffect(() => { setTextoBusca((t) => (normalizar(t).trim() === normalizar(busca).trim() ? t : busca)) }, [busca])
  useEffect(() => { const t = setTimeout(() => { if (textoBusca !== busca) { const p = new URLSearchParams(params); if (textoBusca.trim()) p.set('q', textoBusca); else p.delete('q'); setParams(p, { replace: true }); if (textoBusca.trim().length > 2) filtro('busca', textoBusca.trim()) } }, 400); return () => clearTimeout(t) }, [textoBusca]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    const [ini, fim] = faixaDia(dia)
    return futuros.filter((e) => {
      if (dia !== 'todos') {
        const fimEv = e.fim || e.inicio
        if (fimEv < ini || (fim && e.inicio >= fim)) return false
      }
      if (cidade && e.cidade !== cidade) return false
      if (genero && !(e.generos || []).includes(genero)) return false
      if (cat && e.categoria !== cat) return false
      if (termos.length) {
        const texto = normalizar([e.titulo, e.localNome, e.cidade, e.descricao, e.instagram, ...(e.atracoes || []), ...(e.generos || []), ...(e.outrosNomes || [])].join(' '))
        if (!termos.every((t) => texto.includes(t))) return false
      }
      if (pos && raio) { const d = km(pos, e); if (d == null || d > raio) return false }
      return true
    }).sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0) || a.inicio - b.inicio)
  }, [futuros, dia, cidade, genero, cat, termos, pos, raio])

  const noDia = (e, d) => {
    if (d === 'todos') return true
    const [ini, fim] = faixaDia(d); const fimEv = e.fim || e.inicio
    return !(fimEv < ini || (fim && e.inicio >= fim))
  }
  const contaDias = useMemo(() => Object.fromEntries(DIAS.map((d) => [d.id, futuros.filter((e) => noDia(e, d.id)).length])), [futuros]) // eslint-disable-line react-hooks/exhaustive-deps
  const contaCat = useMemo(() => {
    const m = {}; futuros.forEach((e) => { if (noDia(e, dia)) m[e.categoria] = (m[e.categoria] || 0) + 1 }); return m
  }, [futuros, dia]) // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = useMemo(() => {
    const m = new Map()
    filtrados.forEach((e) => {
      const k = chaveDia(e.inicio)
      if (!m.has(k)) m.set(k, { titulo: rotuloDia(e.inicio), itens: [] })
      m.get(k).itens.push(e)
    })
    return [...m.values()]
  }, [filtrados])

  const nExtras = [cidade, genero].filter(Boolean).length
  const nFiltros = nExtras + (cat ? 1 : 0)
  const temFiltro = dia !== 'todos' || nFiltros > 0 || !!busca || (!!pos && !!raio)

  return (
    <>
      <Topo />
      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="pb-4 pt-8 sm:pt-12">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Francisco Beltrão e região</p>
          <h1 className="mt-3 font-display text-[clamp(3.6rem,13vw,7.5rem)] uppercase leading-[.9] tracking-[-.005em]">
            O que vai <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">rolar</span>?
          </h1>
          <p className="mt-4 max-w-xl text-muted">Shows, festas, corridas e tudo o que tá rolando por aqui. Escolhe o rolê.{' '}
            <Link to="/semana" className="whitespace-nowrap font-semibold text-brand underline-offset-4 hover:underline">Ver a semana inteira <ArrowRight className="inline size-4 align-[-2px]" aria-hidden /></Link></p>
          <label className="relative mt-5 block max-w-xl">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={textoBusca} onChange={(x) => setTextoBusca(x.target.value)} placeholder="Buscar banda, bar ou evento"
              className="campo rounded-full py-3 pl-12" enterKeyHint="search" />
          </label>
        </section>

        <div className="sticky top-[61px] z-20 -mx-4 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Deslizar className="flex-1">
              <Segmentado rotulo="Quando" valor={dia} onChange={(v) => setFiltro('dia', v)}
                opcoes={DIAS.map((d) => ({ ...d, n: eventos ? contaDias[d.id] : null }))} />
            </Deslizar>
            <button onClick={pertoDeMim} aria-pressed={!!pos} aria-label="Perto de mim: mostrar a distância e filtrar por raio"
              className={`ferramenta ${pos ? 'ferramenta-on' : ''}`}>
              {buscandoLocal ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Navigation className="size-4" aria-hidden />}
              <span className="hidden sm:inline">Perto de mim</span>
            </button>
            <button onClick={() => setGaveta((g) => !g)} aria-expanded={gaveta} aria-label="Mais filtros: cidade e gênero"
              className={`ferramenta relative ${gaveta || nExtras ? 'ferramenta-marcada' : ''}`}>
              <SlidersHorizontal className="size-4" aria-hidden /><span className="hidden sm:inline">Filtros</span>
              <ChevronDown className={`size-4 transition-transform ${gaveta ? 'rotate-180' : ''}`} aria-hidden />
              {nExtras > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-on-brand">{nExtras}</span>}
            </button>
          </div>

          <Deslizar className="mt-3 -mb-1">
            <AbasCategoria valor={cat} onChange={(v) => setFiltro('categoria', v)} contagem={contaCat} total={eventos ? Object.values(contaCat).reduce((a, b) => a + b, 0) : 0} />
          </Deslizar>

          <div className={`grid transition-[grid-template-rows] duration-300 ${gaveta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
                <Grupo titulo="Cidade" opcoes={cidades.map((c) => [c, c])} valor={cidade} onChange={(v) => setFiltro('cidade', v)} />
                <Grupo titulo="Gênero" opcoes={generos.map((g) => [g, g])} valor={genero} onChange={(v) => setFiltro('genero', v)} />
                {!cidades.length && !generos.length && <p className="mb-3 text-sm text-muted">Mais filtros aparecem quando tiver eventos na agenda.</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setRaioTela(RAIO_MAX); setParams(dia !== 'todos' ? { dia } : {}, { replace: true }) }} className="btn-ghost">Limpar</button>
                  <button onClick={() => setGaveta(false)} className="btn-brand flex-1">Ver {filtrados.length} {filtrados.length === 1 ? 'evento' : 'eventos'}</button>
                </div>
              </div>
            </div>
          </div>

          {erroLocal && <p className="mt-2 text-xs text-danger">{erroLocal}</p>}
          {pos && (
            <div className="mt-2 w-full rounded-xl border border-line bg-surface px-3 pb-1.5 pt-2 sm:max-w-sm">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 shrink-0 text-brand" aria-hidden />
                <span className="flex-1 text-sm font-bold text-brand tabular-nums">{raioTela >= RAIO_MAX ? 'Qualquer distância' : `Até ${raioTela} km`}</span>
                <button onClick={() => { setRaioTela(RAIO_MAX); setFiltro('raio', ''); pertoDeMim() }} className="shrink-0 text-xs font-semibold text-brand underline underline-offset-2">Desligar</button>
              </div>
              <input type="range" min="5" max={RAIO_MAX} step="5" value={raioTela} aria-label="Distância máxima"
                onChange={(x) => setRaioTela(Number(x.target.value))}
                className="mt-1 block w-full accent-[var(--brand)]" />
              <div className="relative mx-2 h-4 text-[10px] font-semibold text-muted tabular-nums" aria-hidden>
                {[0, 50, 100, 150, 200, 250].map((v) => (
                  <span key={v} className="absolute -translate-x-1/2" style={{ left: `${Math.max(0, (v - 5) / (RAIO_MAX - 5)) * 100}%` }}>{v}</span>
                ))}
              </div>
            </div>
          )}

          {!gaveta && nExtras > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[['cidade', cidade], ['genero', genero]].filter(([, v]) => v).map(([k, v]) => (
                <button key={k} onClick={() => setFiltro(k, '')} className="chip chip-on flex items-center gap-1 py-1 text-xs">{v} <X className="size-3.5" aria-label="Tirar filtro" /></button>
              ))}
            </div>
          )}
        </div>

        {erro && <p className="mt-8 rounded-xl bg-danger/10 p-4 text-danger">{erro}</p>}
        {!eventos && !erro && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Carregando eventos">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="esqueleto aspect-[4/5]" />
                <div className="space-y-2 p-3"><div className="esqueleto h-3 w-1/2 rounded" /><div className="esqueleto h-3 w-4/5 rounded" /></div>
              </div>
            ))}
          </div>
        )}

        {eventos && grupos.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
            <CalendarX2 className="mx-auto mb-2 size-10 text-brand" aria-hidden />
            <p className="font-display text-2xl uppercase">Nada rolando {temFiltro ? 'com esses filtros' : 'por enquanto'}</p>
            <p className="mt-1 text-muted">{temFiltro ? 'Tenta outro dia, outra categoria ou uma distância maior.' : 'Volta logo que a agenda enche.'}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {temFiltro && <button onClick={() => { setRaioTela(RAIO_MAX); setTextoBusca(''); setParams({}, { replace: true }) }} className="btn-brand">Ver tudo</button>}
              <Link to="/divulgar" className={temFiltro ? 'btn-ghost' : 'btn-accent'}>Divulgar um evento</Link>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((e) => <CardEvento key={e.id} evento={e} />)}
        </div>
      </main>
      <Rodape />
    </>
  )
}

function Grupo({ titulo, opcoes, valor, onChange }) {
  if (!opcoes.length) return null
  return (
    <div className="mb-5">
      <p className="rotulo">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map(([v, nome]) => (
          <button key={v} onClick={() => onChange(valor === v ? '' : v)} className={`chip ${valor === v ? 'chip-on' : ''}`}>{nome}</button>
        ))}
      </div>
    </div>
  )
}

export function Rodape() {
  return (
    <footer className="border-t border-line py-8 text-center text-sm text-muted">
      <Logo className="mx-auto mb-2 h-12 w-auto text-ink" />
      <p>Agenda de Francisco Beltrão e região · oquevairolar.com.br</p>
      <nav className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 font-semibold text-brand">
        <Link to="/semana" className="hover:underline">Esta semana</Link>
        <Link to="/meus-roles" className="hover:underline">Meus rolês</Link>
        <Link to="/divulgar" className="hover:underline">Divulgar evento</Link>
        <button onClick={abrirInstalar} className="hover:underline">Instalar o app no celular</button>
      </nav>
    </footer>
  )
}
