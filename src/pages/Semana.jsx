import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Topo from '../components/Topo'
import { Rodape } from './Inicio'
import { listarPublicados } from '../lib/eventos'
import { categoria } from '../lib/constantes'
import { hora, inicioDoDia, addDias, chaveDia, rotuloDia, diaMes, mesCurto } from '../lib/datas'
import { clique } from '../lib/visitas'
import { Share2, Check, Copy, ArrowRight } from 'lucide-react'

// "Esta semana": a agenda dos próximos 7 dias em lista, pronta para mandar no WhatsApp.
export default function Semana() {
  const [eventos, setEventos] = useState(null)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { listarPublicados().then(setEventos).catch(() => setEventos([])) }, [])
  useEffect(() => { document.title = 'Esta semana · O Que Vai Rolar?'; return () => { document.title = 'O Que Vai Rolar? · Agenda do Sudoeste do Paraná' } }, [])

  const hoje = inicioDoDia(), fim = addDias(hoje, 7)
  const dias = useMemo(() => {
    if (!eventos) return null
    const m = new Map()
    eventos.filter((e) => e.inicio < fim && (e.fim || e.inicio) >= hoje).sort((a, b) => a.inicio - b.inicio).forEach((e) => {
      const d = e.inicio < hoje ? hoje : e.inicio
      const k = chaveDia(d); if (!m.has(k)) m.set(k, { data: d, itens: [] }); m.get(k).itens.push(e)
    })
    return [...m.values()]
  }, [eventos]) // eslint-disable-line react-hooks/exhaustive-deps

  const url = `${location.origin}/semana?o=whatsapp`
  const texto = useMemo(() => {
    if (!dias?.length) return ''
    const linhas = ['*O QUE VAI ROLAR ESTA SEMANA* 🎉', '']
    dias.forEach((d) => {
      linhas.push(`*${rotuloDia(d.data).toUpperCase()}*`)
      d.itens.forEach((e) => linhas.push(`• ${hora(e.inicio)} — ${e.titulo}${e.localNome ? ` (${e.localNome})` : ''}${e.gratuito ? ' · grátis' : ''}`))
      linhas.push('')
    })
    linhas.push(`Agenda completa: ${url}`)
    return linhas.join('\n')
  }, [dias]) // eslint-disable-line react-hooks/exhaustive-deps

  const whatsapp = () => { clique('semana-whatsapp'); window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank') }
  const copiar = async () => { clique('semana-copiar'); await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }
  const compartilhar = async () => { if (navigator.share) { try { await navigator.share({ title: 'O que vai rolar esta semana', text: texto }) ; clique('semana-compartilhar') } catch {} } else copiar() }

  const total = dias?.reduce((n, d) => n + d.itens.length, 0) || 0
  return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 pb-20 pt-8">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-ink">{diaMes(hoje)} {mesCurto(hoje)} a {diaMes(addDias(hoje, 6))} {mesCurto(addDias(hoje, 6))}</p>
        <h1 className="mt-3 font-display text-[clamp(3.2rem,10.5vw,5.5rem)] uppercase leading-[.88]">Esta <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">semana</span></h1>
        <p className="mt-3 text-muted">{dias ? `${total} ${total === 1 ? 'evento' : 'eventos'} nos próximos 7 dias no Sudoeste do Paraná.` : 'Carregando…'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={whatsapp} disabled={!total} className="btn bg-[#25D366] text-[#073b1c] hover:brightness-95"><Share2 className="size-5" aria-hidden /> Mandar no WhatsApp</button>
          <button onClick={compartilhar} disabled={!total} className="btn-ghost">{copiado ? <><Check className="size-5 text-brand-ink" /> Copiado</> : <><Copy className="size-5" aria-hidden /> Copiar lista</>}</button>
        </div>

        {!dias && <div className="mt-8 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="esqueleto h-16 rounded-xl" />)}</div>}
        {dias && !dias.length && <p className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center text-muted">Nada na agenda para esta semana ainda. <Link className="font-semibold text-brand-ink" to="/divulgar">Divulgar um evento</Link></p>}

        <div className="mt-8 space-y-8">
          {dias?.map((d) => (
            <section key={chaveDia(d.data)} className="grid gap-3 sm:grid-cols-[7rem_1fr]">
              <h2 className="font-display text-3xl uppercase leading-none sm:sticky sm:top-20 sm:self-start">
                {rotuloDia(d.data).split(' · ')[0]}<span className="mt-1 block font-sans text-sm font-semibold normal-case tracking-normal text-muted">{diaMes(d.data)} {mesCurto(d.data)}</span>
              </h2>
              <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {d.itens.map((e) => {
                  const c = categoria(e.categoria)
                  return (
                    <li key={e.id}>
                      <Link to={`/evento/${e.id}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                        <span className="w-12 shrink-0 font-display text-xl tabular-nums">{hora(e.inicio)}</span>
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: c.cor }} aria-hidden />
                        <span className="min-w-0 flex-1">
                          <b className="block truncate group-hover:text-brand-ink">{e.titulo}</b>
                          <span className="block truncate text-sm text-muted">{[e.localNome, e.cidade].filter(Boolean).join(' · ')}{e.gratuito ? ' · Grátis' : e.preco ? ` · ${e.preco}` : ''}</span>
                        </span>
                        <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-ink" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      </main><Rodape /></>
  )
}
