import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import Logo from '../components/Logo'
import { listarPublicados } from '../lib/eventos'
import { faixaDia, rotuloDia, chaveDia } from '../lib/datas'
import { CATEGORIAS } from '../lib/constantes'
import { SlidersHorizontal, X, CalendarX2 } from 'lucide-react'

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
  const categoriasUsadas = useMemo(() => CATEGORIAS.filter((c) => futuros.some((e) => e.categoria === c.id)), [futuros])

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

  const nFiltros = [cidade, genero, cat].filter(Boolean).length
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
            <button onClick={() => setGaveta(true)} className={`chip flex items-center gap-1.5 ${nFiltros ? 'border-brand text-brand' : ''}`}>
              <SlidersHorizontal className="size-4" aria-hidden /> Filtros{nFiltros ? ` (${nFiltros})` : ''}
            </button>
          </div>
          {nFiltros > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[['cidade', cidade], ['genero', genero], ['categoria', cat && CATEGORIAS.find((c) => c.id === cat)?.nome]].filter(([, v]) => v).map(([k, v]) => (
                <button key={k} onClick={() => setFiltro(k, '')} className="chip chip-on flex items-center gap-1 py-1 text-xs">{v} <X className="size-3.5" aria-label="Tirar filtro" /></button>
              ))}
            </div>
          )}
        </div>

        {gaveta && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setGaveta(false)}>
            <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 sm:max-w-lg sm:rounded-3xl" onClick={(ev) => ev.stopPropagation()}>
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line sm:hidden" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl uppercase">Filtros</h2>
                <button onClick={() => setGaveta(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-full hover:bg-surface-2"><X className="size-5" /></button>
              </div>
              <Grupo titulo="Cidade" opcoes={cidades.map((c) => [c, c])} valor={cidade} onChange={(v) => setFiltro('cidade', v)} />
              <Grupo titulo="Gênero" opcoes={generos.map((g) => [g, g])} valor={genero} onChange={(v) => setFiltro('genero', v)} />
              {categoriasUsadas.length > 1 && (
                <Grupo titulo="Tipo de evento" opcoes={categoriasUsadas.map((c) => [c.id, c.nome])} valor={cat} onChange={(v) => setFiltro('categoria', v)} />
              )}
              <div className="sticky bottom-0 -mx-5 mt-2 flex gap-2 border-t border-line bg-surface px-5 pt-3">
                <button onClick={() => { setParams(dia !== 'todos' ? { dia } : {}, { replace: true }) }} className="btn-ghost">Limpar</button>
                <button onClick={() => setGaveta(false)} className="btn-brand flex-1">Ver {filtrados.length} {filtrados.length === 1 ? 'evento' : 'eventos'}</button>
              </div>
            </div>
          </div>
        )}

        {erro && <p className="mt-8 rounded-xl bg-danger/10 p-4 text-danger">{erro}</p>}
        {!eventos && !erro && (
          <div className="mt-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-2" />)}</div>
        )}

        {eventos && grupos.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
            <CalendarX2 className="mx-auto mb-2 size-10 text-brand" aria-hidden />
            <p className="font-display text-2xl uppercase">Nada rolando {temFiltro ? 'com esses filtros' : 'por enquanto'}</p>
            <p className="mt-1 text-muted">{temFiltro ? 'Tenta tirar algum filtro.' : 'Volta logo que a agenda enche.'}</p>
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
      <Logo className="mx-auto mb-2 h-10 w-auto text-ink" />
      <p>Agenda de Francisco Beltrão e região · oquevairolar.com.br</p>
    </footer>
  )
}
