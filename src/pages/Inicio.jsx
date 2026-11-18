import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import { listarPublicados } from '../lib/eventos'
import { faixaDia, rotuloDia, chaveDia } from '../lib/datas'
import { CATEGORIAS } from '../lib/constantes'

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

  const temFiltro = dia !== 'todos' || cidade || genero || cat

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

        <div className="sticky top-[61px] z-20 -mx-4 space-y-2 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {DIAS.map((d) => (
              <button key={d.id} onClick={() => setFiltro('dia', d.id)} className={`chip ${dia === d.id ? 'chip-on' : ''}`}>{d.nome}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={cidade} onChange={(e) => setFiltro('cidade', e.target.value)} aria-label="Cidade"
              className="chip max-w-[45%] appearance-none sm:max-w-none">
              <option value="">📍 Cidade</option>
              {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={genero} onChange={(e) => setFiltro('genero', e.target.value)} aria-label="Gênero"
              className="chip max-w-[45%] appearance-none sm:max-w-none">
              <option value="">🎵 Gênero</option>
              {generos.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {categoriasUsadas.length > 1 && (
              <select value={cat} onChange={(e) => setFiltro('categoria', e.target.value)} aria-label="Tipo de evento"
                className="chip appearance-none">
                <option value="">✨ Tipo</option>
                {categoriasUsadas.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
              </select>
            )}
            {temFiltro && (
              <button onClick={() => setParams({}, { replace: true })} className="chip border-transparent bg-transparent text-brand underline">Limpar</button>
            )}
          </div>
        </div>

        {erro && <p className="mt-8 rounded-xl bg-danger/10 p-4 text-danger">{erro}</p>}
        {!eventos && !erro && (
          <div className="mt-6 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-2" />)}</div>
        )}

        {eventos && grupos.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="font-display text-2xl uppercase">Nada rolando {temFiltro ? 'com esses filtros' : 'por enquanto'}</p>
            <p className="mt-1 text-muted">{temFiltro ? 'Tenta tirar algum filtro.' : 'Volta logo que a agenda enche.'}</p>
          </div>
        )}

        {grupos.map((g) => (
          <section key={g.titulo} className="mt-7">
            <h2 className="mb-3 flex items-center gap-2 font-display text-2xl uppercase tracking-wide">
              <span className="h-6 w-1.5 rounded-full bg-brand" />{g.titulo}
              <span className="font-sans text-sm font-semibold normal-case text-muted">· {g.itens.length} {g.itens.length === 1 ? 'evento' : 'eventos'}</span>
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {g.itens.map((e) => <CardEvento key={e.id} evento={e} />)}
            </div>
          </section>
        ))}
      </main>
      <Rodape />
    </>
  )
}

export function Rodape() {
  return (
    <footer className="border-t border-line py-8 text-center text-sm text-muted">
      <p className="font-display text-lg uppercase text-ink">O que vai rolar<span className="text-brand">?</span></p>
      <p>Agenda de Francisco Beltrão e região · oquevairolar.com.br</p>
    </footer>
  )
}
