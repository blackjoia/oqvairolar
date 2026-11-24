import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import Logo from '../components/Logo'
import Deslizar from '../components/Deslizar'
import Destaques from '../components/Destaques'
import { RANKING_LIGADO } from '../lib/recursos'
import Segmentado from '../components/Segmentado'
import AbasCategoria from '../components/AbasCategoria'
import { abrirInstalar } from '../components/InstalarApp'
import HojeANoite from '../components/HojeANoite'
import EmAlta from '../components/EmAlta'
import { PrimeiraCidade, SeletorCidade } from '../components/EscolherCidade'
import { useCidadePreferida, definirCidade } from '../lib/cidade'
import { listarPublicados } from '../lib/eventos'
import { faixaDia, rotuloDia, chaveDia } from '../lib/datas'
import { CATEGORIAS, categoria as dadosCat, subfiltros, casaSub, FIXOS } from '../lib/constantes'
import { filtro, clique } from '../lib/visitas'
import { normalizar } from '../lib/parecidos'
import { km, useMinhaPosicao, pedirLocalizacao, esquecerLocalizacao } from '../lib/distancia'
import { X, CalendarX2, Search, Navigation, LoaderCircle, ArrowRight, WifiOff } from 'lucide-react'

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
  const [semRede, setSemRede] = useState(false)
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
  // Cidade: a da URL (link compartilhado) vence; senão, a preferida deste aparelho.
  const pref = useCidadePreferida()
  const cidadeUrl = params.get('cidade') || ''
  const cidade = cidadeUrl ? (cidadeUrl === 'todas' ? '' : cidadeUrl) : (pref && pref !== 'todas' ? pref : '')
  const escolherCidade = (v) => {
    definirCidade(v); filtro('cidade', v)
    const p = new URLSearchParams(params); p.delete('cidade'); setParams(p, { replace: true })
  }
  const genero = params.get('genero') || ''
  const cat = params.get('categoria') || ''
  const busca = params.get('q') || ''

  const setFiltro = (k, v) => {
    const p = new URLSearchParams(params)
    if (!v || v === 'todos') p.delete(k); else { p.set(k, v); filtro(k, v) }
    setParams(p, { replace: true })
  }

  useEffect(() => {
    listarPublicados().then((lista) => {
      setEventos(lista); setSemRede(false)
      try { localStorage.setItem('agenda-cache', JSON.stringify(lista)) } catch {}
    }).catch((e) => {
      console.error(e)
      // Sem internet: mostra a última agenda carregada neste aparelho.
      let cache = null
      try { cache = JSON.parse(localStorage.getItem('agenda-cache') || 'null') } catch {}
      if (cache?.length) {
        setEventos(cache.map((x) => ({ ...x, inicio: new Date(x.inicio), fim: x.fim ? new Date(x.fim) : null })))
        setSemRede(true)
      } else setErro(navigator.onLine === false ? 'Sem internet agora. Assim que voltar, a agenda aparece aqui.' : 'Não deu para carregar a agenda agora. Tente de novo em instantes.')
    })
  }, [])

  const agora = new Date()
  const futuros = useMemo(() => (eventos || []).filter((e) => (e.fim || new Date(e.inicio.getTime() + 6 * 3600000)) > agora), [eventos])

  // Cidades com rolê, as com mais eventos primeiro: [nome, quantidade]
  const cidades = useMemo(() => {
    const m = new Map(); futuros.forEach((e) => { if (e.cidade) m.set(e.cidade, (m.get(e.cidade) || 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [futuros])
  const naCidade = useMemo(() => futuros.filter((e) => !cidade || e.cidade === cidade), [futuros, cidade])

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
      if (genero && !casaSub(e, genero)) return false
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
  const contaDias = useMemo(() => Object.fromEntries(DIAS.map((d) => [d.id, naCidade.filter((e) => noDia(e, d.id)).length])), [naCidade]) // eslint-disable-line react-hooks/exhaustive-deps
  const contaCat = useMemo(() => {
    const m = {}; naCidade.forEach((e) => { if (noDia(e, dia)) m[e.categoria] = (m[e.categoria] || 0) + 1 }); return m
  }, [naCidade, dia]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subfiltros da categoria escolhida: só os que têm evento, os mais comuns primeiro.
  const subs = useMemo(() => {
    if (!cat) return []
    const daCat = futuros.filter((e) => e.categoria === cat)
    const naTela = daCat.filter((e) => noDia(e, dia) && (!cidade || e.cidade === cidade))
    return subfiltros(cat)
      .map((s, i) => ({ id: s.nome, nome: s.nome, i, total: daCat.filter((e) => casaSub(e, s.nome)).length, n: naTela.filter((e) => casaSub(e, s.nome)).length }))
      .map((s) => ({ ...s, fixo: (FIXOS[cat] || []).indexOf(s.id) }))
      .filter((s) => s.total > 0 || s.fixo >= 0)
      .sort((a, b) => (a.fixo < 0) - (b.fixo < 0) || (a.fixo - b.fixo) || b.total - a.total || a.i - b.i)
  }, [futuros, cat, dia, cidade]) // eslint-disable-line react-hooks/exhaustive-deps
  const subAtivo = genero && subfiltros(cat).find((s) => s.nome === genero || s.inclui.includes(genero))
  const escolherCat = (v) => {
    const p = new URLSearchParams(params)
    p.delete('genero')
    if (v) { p.set('categoria', v); filtro('categoria', v) } else p.delete('categoria')
    setParams(p, { replace: true })
  }

  const grupos = useMemo(() => {
    const m = new Map()
    filtrados.forEach((e) => {
      const k = chaveDia(e.inicio)
      if (!m.has(k)) m.set(k, { k, titulo: rotuloDia(e.inicio), data: e.inicio, itens: [] })
      m.get(k).itens.push(e)
    })
    return [...m.values()]
  }, [filtrados])

  const nExtras = [!cat && genero].filter(Boolean).length
  const nFiltros = nExtras + (cat ? 1 : 0)
  const temFiltro = dia !== 'todos' || nFiltros > 0 || !!busca || (!!pos && !!raio)
  // Primeira vez no app: pergunta a cidade (só se tiver mais de uma com rolê e o link não escolheu uma)
  const perguntarCidade = !pref && !cidadeUrl && cidades.length > 1

  return (
    <>
      <Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-24">
        <section className={`pb-4 pt-5 sm:pt-12 ${RANKING_LIGADO ? 'md:grid md:grid-cols-[minmax(0,1fr)_300px] md:gap-x-8 lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
          <SeletorCidade cidade={cidade} cidades={cidades} onEscolher={escolherCidade} />
          <h1 className="mt-2 font-display text-[clamp(2.6rem,9.5vw,6rem)] sm:mt-3 uppercase leading-[.9] tracking-[-.005em]">
            O que vai <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">rolar</span>?
          </h1>
          <p className="mt-4 hidden max-w-xl text-muted md:block">Shows, festas, corridas e tudo o que tá rolando por aqui. Escolhe o rolê.{' '}
            <Link to="/semana" className="link-toque -my-2 whitespace-nowrap font-semibold text-brand-ink underline-offset-4 hover:underline">Ver a semana inteira <ArrowRight className="inline size-4 align-[-2px]" aria-hidden /></Link></p>
          {RANKING_LIGADO && <Destaques semana={eventos ? eventos.filter((e) => e.inicio - Date.now() < 7 * 86400000).length : 0} />}
          <label className="relative mt-4 block max-w-xl md:mt-5">
            <span className="sr-only">Buscar</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={textoBusca} onChange={(x) => setTextoBusca(x.target.value)} placeholder="Buscar banda, bar ou evento"
              className="campo rounded-full py-3 pl-12" enterKeyHint="search" />
          </label>
        </section>

        {eventos && !temFiltro && (<>
          <HojeANoite eventos={naCidade} />
          <EmAlta eventos={naCidade} />
        </>)}
        {perguntarCidade && <PrimeiraCidade cidades={cidades} onEscolher={escolherCidade} />}

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
          </div>

          <Deslizar className="mt-3 -mb-1">
            <AbasCategoria valor={cat} onChange={escolherCat} contagem={contaCat} total={eventos ? Object.values(contaCat).reduce((a, b) => a + b, 0) : 0} />
          </Deslizar>

          {subs.length > 0 && (
            <Deslizar key={cat} className="sub-entra mt-3">
              <Segmentado rotulo={`Tipos de ${dadosCat(cat).nome}`} cor={dadosCat(cat).cor} tinta={dadosCat(cat).tinta} valor={subAtivo ? subAtivo.nome : (genero || '')}
                onChange={(v) => setFiltro('genero', v)}
                opcoes={[{ id: '', nome: 'Todos' }, ...subs]} />
            </Deslizar>
          )}

          {erroLocal && <p className="mt-2 text-xs text-danger">{erroLocal}</p>}
          {pos && (
            <div className="mt-2 w-full rounded-xl border border-line bg-surface px-3 pb-1.5 pt-2 sm:max-w-sm">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 shrink-0 text-brand-ink" aria-hidden />
                <span className="flex-1 text-sm font-bold text-brand-ink tabular-nums">{raioTela >= RAIO_MAX ? 'Qualquer distância' : `Até ${raioTela} km`}</span>
                <button onClick={() => { setRaioTela(RAIO_MAX); setFiltro('raio', ''); pertoDeMim() }} className="shrink-0 text-xs font-semibold text-brand-ink underline underline-offset-2">Desligar</button>
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

          {nExtras > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[['genero', !cat && genero]].filter(([, v]) => v).map(([k, v]) => (
                <button key={k} onClick={() => setFiltro(k, '')} className="chip chip-on flex items-center gap-1 py-1 text-xs">{v} <X className="size-3.5" aria-label="Tirar filtro" /></button>
              ))}
            </div>
          )}
        </div>

        {erro && <p className="mt-8 rounded-xl bg-danger/10 p-4 text-danger" role="alert">{erro}</p>}
        {semRede && <p className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm" role="status"><WifiOff className="size-4 shrink-0 text-brand-ink" aria-hidden /> Sem internet. Mostrando a última agenda carregada neste aparelho.</p>}
        {!eventos && !erro && (
          <div className="mt-5 grid grid-cols-2 gap-3 min-[540px]:grid-cols-3 md:grid-cols-4" aria-label="Carregando eventos">
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
            <CalendarX2 className="mx-auto mb-2 size-10 text-brand-ink" aria-hidden />
            <p className="font-display text-2xl uppercase">Nada rolando {temFiltro ? 'com esses filtros' : cidade ? `em ${cidade} por enquanto` : 'por enquanto'}</p>
            <p className="mt-1 text-muted">{temFiltro ? 'Tenta outro dia, outra categoria ou uma distância maior.' : 'Volta logo que a agenda enche.'}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {temFiltro && <button onClick={() => { setRaioTela(RAIO_MAX); setTextoBusca(''); setParams({}, { replace: true }) }} className="btn-brand">Ver tudo</button>}
              {cidade && <button onClick={() => escolherCidade('todas')} className="btn-ghost">Ver todas as cidades</button>}
              <Link to="/divulgar" className={temFiltro ? 'btn-ghost' : 'btn-accent'}>Divulgar um evento</Link>
            </div>
          </div>
        )}

        <h2 className="sr-only">Eventos</h2>
        {(() => { let i = 0; return grupos.map((g, gi) => (
          <section key={g.k} aria-labelledby={`dia-${g.k}`} className="mt-7 first-of-type:mt-5">
            <h3 id={`dia-${g.k}`} className="flex items-baseline gap-2 border-b border-line pb-2 font-display text-3xl uppercase leading-none sm:text-4xl">
              {g.titulo}
              {!/\d/.test(g.titulo) && <span className="num font-sans text-sm font-semibold normal-case text-muted">{g.data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}</span>}
              <span className="num ml-auto font-sans text-sm font-semibold normal-case text-muted">{g.itens.length} {g.itens.length === 1 ? 'evento' : 'eventos'}</span>
            </h3>
            <div className="cascata mt-3 grid grid-cols-2 gap-3 min-[540px]:grid-cols-3 md:grid-cols-4">
              {g.itens.map((e, j) => <CardEvento key={e.id} evento={e} soHora grande={dia === 'todos' && !busca && (g.titulo === 'Hoje' || (gi === 0 && j === 0))} style={{ '--i': i++ }} />)}
            </div>
          </section>
        )) })()}
      </main>
      <Rodape />
    </>
  )
}

export function Rodape() {
  return (
    <footer className="border-t border-line py-8 text-center text-sm text-muted">
      <Logo className="mx-auto mb-2 h-12 w-auto text-ink" />
      <p>Agenda do Sudoeste do Paraná · oquevairolar.com.br</p>
      <nav className="mt-3 flex flex-wrap justify-center gap-x-3 font-semibold text-brand-ink">
        <Link to="/semana" className="link-toque px-1 hover:underline">Esta semana</Link>
        <Link to="/meus-roles" className="link-toque px-1 hover:underline">Meus rolês</Link>
        {RANKING_LIGADO && <Link to="/ranking" className="link-toque px-1 hover:underline">Ranking</Link>}
        <Link to="/divulgar" className="link-toque px-1 hover:underline">Divulgar evento</Link>
        <button onClick={abrirInstalar} className="link-toque px-1 hover:underline">Instalar o app no celular</button>
      </nav>
    </footer>
  )
}
