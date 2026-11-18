import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import Logo from '../components/Logo'
import { listarPublicados } from '../lib/eventos'
import { faixaDia, rotuloDia, chaveDia } from '../lib/datas'
import { CATEGORIAS } from '../lib/constantes'
import { SlidersHorizontal, X, CalendarX2, ChevronDown } from 'lucide-react'

const DIAS = [
  { id: 'todos', nome: 'Tudo' },
  { id: 'hoje', nome: 'Hoje' },
  { id: 'amanha', nome: 'Amanhã' },
  { id: 'fds', nome: 'Fim de semana' },
  { id: 'semana', nome: 'Próximos 7 dias' },
]

export default function Inicio() {
  const [eventos, setEventos] = useState(null)
  const [erro, setErro] = useState('')
  const [gaveta, setGaveta] = useState(false)
  const [params, setParams] = useSearchParams()
  const dia = params.get('dia') || 'todos'
  const cidade = params.get('cidade') || ''
  const genero = params.get('genero') || ''
  const cat = params.get('categoria') || ''

  const setFiltro = (k, v) => {
    const p = new URLSearchParams(params)
    if (!v || v === 'todos') p.delete(k); else p.set(k, v)
    setParams(p, { replace: true })
  }

  useEffect(() => {
    listarPublicados().then(setEventos).catch((e) => { console.error(e); setErro('Não deu para carregar a agenda agora. Tente de novo em instantes.') })
  }, [])

  const agora = new Date()
  const futuros = useMemo(() => (eventos || []).filter((e) => (e.fim || new Date(e.inicio.getTime() + 6 * 3600000)) > agora), [eventos])

  const cidades = useMemo(() => [...new Set(futuros.map((e) => e.cidade).filter(Boolean))].sort(), [futuros])
  const generos = useMemo(() => [...new Set(futuros.flatMap((e) => e.generos || []))].sort(), [futuros])

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
      return true
    })
  }, [futuros, dia, cidade, genero, cat])

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
  const temFiltro = dia !== 'todos' || nFiltros > 0

  return (
    <>
      <Topo />
      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="pb-4 pt-8 sm:pt-12">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Francisco Beltrão e região</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[.95] sm:text-7xl">
            O que vai <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">rolar</span>?
          </h1>
          <p className="mt-4 max-w-xl text-muted">Shows, festas, corridas e tudo o que tá rolando por aqui. Escolhe o rolê.</p>
        </section>

        <div className="sticky top-[61px] z-20 -mx-4 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
              {DIAS.map((d) => (
                <button key={d.id} onClick={() => setFiltro('dia', d.id)} className={`chip ${dia === d.id ? 'chip-on' : ''}`}>{d.nome}</button>
              ))}
            </div>
            <button onClick={() => setGaveta((g) => !g)} aria-expanded={gaveta} className={`chip flex items-center gap-1.5 ${gaveta || nExtras ? 'border-brand text-brand' : ''}`}>
              <SlidersHorizontal className="size-4" aria-hidden /> Filtros{nExtras ? ` (${nExtras})` : ''}
              <ChevronDown className={`size-4 transition-transform ${gaveta ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          </div>

          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {CATEGORIAS.map((c) => {
              const on = cat === c.id
              return (
                <button key={c.id} onClick={() => setFiltro('categoria', on ? '' : c.id)} aria-pressed={on}
                  className={`chip flex shrink-0 items-center gap-1.5 py-1.5 text-sm ${on ? 'chip-on' : ''}`}>
                  <c.Icone className="size-4" style={on ? undefined : { color: c.cor }} aria-hidden /> {c.nome}
                </button>
              )
            })}
          </div>

          <div className={`grid transition-[grid-template-rows] duration-300 ${gaveta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
                <Grupo titulo="Cidade" opcoes={cidades.map((c) => [c, c])} valor={cidade} onChange={(v) => setFiltro('cidade', v)} />
                <Grupo titulo="Gênero" opcoes={generos.map((g) => [g, g])} valor={genero} onChange={(v) => setFiltro('genero', v)} />
                {!cidades.length && !generos.length && <p className="mb-3 text-sm text-muted">Mais filtros aparecem quando tiver eventos na agenda.</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setParams(dia !== 'todos' ? { dia } : {}, { replace: true }) }} className="btn-ghost">Limpar</button>
                  <button onClick={() => setGaveta(false)} className="btn-brand flex-1">Ver {filtrados.length} {filtrados.length === 1 ? 'evento' : 'eventos'}</button>
                </div>
              </div>
            </div>
          </div>

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
          <div className="mt-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-2" />)}</div>
        )}

        {eventos && grupos.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
            <CalendarX2 className="mx-auto mb-2 size-10 text-brand" aria-hidden />
            <p className="font-display text-2xl uppercase">Nada rolando {temFiltro ? 'com esses filtros' : 'por enquanto'}</p>
            <p className="mt-1 text-muted">{temFiltro ? 'Tenta tirar algum filtro.' : 'Volta logo que a agenda enche.'}</p>
            <Link to="/divulgar" className="btn-accent mt-4">Divulgar um evento</Link>
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
    </footer>
  )
}
