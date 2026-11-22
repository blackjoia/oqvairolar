import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarVisitas } from '../../lib/visitas'
import { collection, getCountFromServer, query, where, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { listarTodos } from '../../lib/eventos'
import { CATEGORIAS } from '../../lib/constantes'
import { Users, UserPlus, Eye, Ticket, Share2, Send, MousePointerClick, Inbox, CalendarDays, Plus } from 'lucide-react'

const PERIODOS = [[7, '7 dias'], [30, '30 dias'], [90, '90 dias']]
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ACOES = { ingresso: 'Comprar ingresso', agenda: 'Adicionar à agenda', compartilhar: 'Compartilhar', story: 'Arte para Story', rota: 'Como chegar', instagram: 'Abrir Instagram', 'divulgar-enviado': 'Evento enviado pelo formulário', 'instalar-app': 'Instalar app', 'eu-vou': 'Eu vou', interesse: 'Tenho interesse' }
const ORIGENS = { direto: 'Direto / WhatsApp', instagram: 'Instagram', facebook: 'Facebook', google: 'Google', whatsapp: 'WhatsApp', compartilhado: 'Link compartilhado do site' }
const FILTROS = { dia: 'Dia', categoria: 'Categoria', cidade: 'Cidade', genero: 'Gênero' }
const fmt = (n) => n.toLocaleString('pt-BR')
const chaveDia = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const horaSP = (d) => Number(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false })) % 24
const semanaSP = (d) => new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getDay()

function contar(lista, chave) {
  const m = new Map()
  lista.forEach((x) => { const k = chave(x); if (k != null) m.set(k, (m.get(k) || 0) + 1) })
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
const unicos = (lista, campo) => new Set(lista.map((x) => x[campo])).size

export default function Estatisticas() {
  const [dias, setDias] = useState(30)
  const [visitas, setVisitas] = useState(null)
  const [eventos, setEventos] = useState([])
  const [erro, setErro] = useState('')
  const [contas, setContas] = useState(null)

  useEffect(() => { listarTodos().then(setEventos).catch(() => {}) }, [])
  useEffect(() => {
    setVisitas(null); setErro('')
    listarVisitas(dias).then(setVisitas).catch((e) => { console.error(e); setErro('Não deu para carregar as estatísticas: ' + e.message) })
  }, [dias])
  // Contas criadas (login com Google): total e quantas no período escolhido
  useEffect(() => {
    const col = collection(db, 'usuarios')
    const desde = Timestamp.fromDate(new Date(Date.now() - dias * 86400000))
    Promise.all([getCountFromServer(col), getCountFromServer(query(col, where('criadoEm', '>=', desde)))])
      .then(([t, p]) => setContas({ total: t.data().count, periodo: p.data().count }))
      .catch((e) => { console.error(e); setContas({ total: null, periodo: null }) })
  }, [dias])

  const r = useMemo(() => {
    if (!visitas) return null
    const paginas = visitas.filter((v) => v.tipo === 'pagina')
    const cliques = visitas.filter((v) => v.tipo === 'clique')
    const filtros = visitas.filter((v) => v.tipo === 'filtro')
    const vistasEvento = paginas.filter((v) => v.eventoId)
    const nomeEv = new Map(eventos.map((e) => [e.id, e]))

    // Série por dia, com todos os dias do período (inclusive os zerados)
    const porDia = new Map()
    for (let i = dias - 1; i >= 0; i--) porDia.set(chaveDia(new Date(Date.now() - i * 86400000)), { vis: new Set(), pag: 0 })
    paginas.forEach((v) => { const d = porDia.get(chaveDia(v.em)); if (d) { d.vis.add(v.visitante); d.pag++ } })
    const serie = [...porDia.entries()].map(([k, d]) => ({ k, visitantes: d.vis.size, paginas: d.pag }))

    const horas = Array.from({ length: 24 }, () => 0); paginas.forEach((v) => horas[horaSP(v.em)]++)
    const semana = Array.from({ length: 7 }, () => 0); paginas.forEach((v) => semana[semanaSP(v.em)]++)

    const topEv = contar(vistasEvento, (v) => v.eventoId).slice(0, 10).map(([id, n]) => {
      const c = cliques.filter((x) => x.eventoId === id)
      return { id, ev: nomeEv.get(id), vistas: n, pessoas: unicos(vistasEvento.filter((x) => x.eventoId === id), 'visitante'),
        ingresso: c.filter((x) => x.acao === 'ingresso').length, compart: c.filter((x) => x.acao === 'compartilhar').length,
        agenda: c.filter((x) => x.acao === 'agenda').length }
    })

    const visitantesSet = new Set(paginas.map((v) => v.visitante))
    const viramEvento = new Set(vistasEvento.map((v) => v.visitante))
    const agiram = new Set(cliques.filter((c) => ['ingresso', 'agenda', 'compartilhar', 'rota', 'story'].includes(c.acao)).map((c) => c.visitante))
    // Acesso = 1 por pessoa (aparelho) a cada 24 horas; recarregar ou abrir outras páginas não soma
    const sessoes = new Map(); const ultimo = new Map()
    paginas.forEach((v) => {
      const t = v.em.getTime(), u = ultimo.get(v.visitante)
      if (u == null || t - u >= 86400000) { ultimo.set(v.visitante, t); sessoes.set(`${v.visitante}-${t}`, v) }
    })

    const vistasCat = contar(vistasEvento, (v) => nomeEv.get(v.eventoId)?.categoria || null)
    return {
      visitantes: visitantesSet.size, paginas: paginas.length, sessoes: sessoes.size, vistasEvento: vistasEvento.length,
      ingresso: cliques.filter((c) => c.acao === 'ingresso').length,
      compart: cliques.filter((c) => c.acao === 'compartilhar').length,
      enviados: cliques.filter((c) => c.acao === 'divulgar-enviado').length,
      serie, horas, semana, topEv,
      origem: contar([...sessoes.values()], (v) => v.origem),
      disp: contar([...sessoes.values()], (v) => v.disp),
      acoes: contar(cliques, (c) => c.acao),
      filtros: contar(filtros, (f) => `${FILTROS[f.acao] || f.acao}: ${f.acao === 'categoria' ? (CATEGORIAS.find((c) => c.id === f.valor)?.nome || f.valor) : f.valor}`).slice(0, 10),
      vistasCat,
      funil: [['Visitaram o site', visitantesSet.size], ['Abriram algum evento', viramEvento.size], ['Ingresso, agenda, rota ou compartilhar', agiram.size]],
      voltaram: [...visitantesSet].filter((id) => new Set(paginas.filter((p) => p.visitante === id).map((p) => chaveDia(p.em))).size > 1).length,
    }
  }, [visitas, eventos, dias])

  return (
    <div>
      <Resumo eventos={eventos} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Estatísticas</h1>
          <p className="text-sm text-muted">Quem visitou o site, o que viu e o que clicou. Suas visitas como admin não entram. Contando desde 19/11, 15h20.</p>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Período">
          {PERIODOS.map(([d, n]) => <button key={d} onClick={() => setDias(d)} className={`chip ${dias === d ? 'chip-on' : ''}`}>{n}</button>)}
        </div>
      </div>

      {erro && <p className="mt-6 rounded-xl bg-danger/10 p-4 text-danger">{erro}</p>}
      {!r && !erro && <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />)}</div>}

      {r && (<>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Numero Icone={UserPlus} rotulo="Usuários cadastrados" valor={contas?.total ?? 0} sub={contas == null ? 'carregando…' : contas.total == null ? 'não deu para contar' : `${fmt(contas.periodo)} novos no período`} />
          <Numero Icone={Users} rotulo="Visitantes" valor={r.visitantes} sub={`${fmt(r.voltaram)} voltaram em outro dia`} />
          <Numero Icone={Eye} rotulo="Páginas vistas" valor={r.paginas} sub={`${fmt(r.sessoes)} acessos (1 por pessoa a cada 24h)`} />
          <Numero Icone={MousePointerClick} rotulo="Eventos abertos" valor={r.vistasEvento} />
          <Numero Icone={Ticket} rotulo="Cliques em ingresso" valor={r.ingresso} />
          <Numero Icone={Share2} rotulo="Compartilhamentos" valor={r.compart} />
          <Numero Icone={Send} rotulo="Enviados pelo formulário" valor={r.enviados} />
        </div>

        {r.paginas === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">Ainda não tem visitas registradas neste período. O contador começou agora, então os números aparecem conforme as pessoas entram no site.</p>
        )}

        <Caixa titulo="Visitantes por dia">
          <Colunas dados={r.serie.map((d) => ({ rotulo: d.k.slice(8, 10) + '/' + d.k.slice(5, 7), valor: d.visitantes, dica: `${d.visitantes} visitantes · ${d.paginas} páginas` }))} rotuloCada={dias > 30 ? 14 : dias > 7 ? 5 : 1} />
        </Caixa>

        <div className="grid gap-x-4 md:grid-cols-2">
          <Caixa titulo="Horário das visitas" sub="Bom para saber a hora de postar">
            <Colunas dados={r.horas.map((v, h) => ({ rotulo: `${h}h`, valor: v, dica: `${h}h às ${h + 1}h · ${v} páginas` }))} rotuloCada={3} altura={110} />
          </Caixa>
          <Caixa titulo="Dia da semana">
            <Colunas dados={r.semana.map((v, i) => ({ rotulo: SEMANA[i], valor: v, dica: `${SEMANA[i]} · ${v} páginas` }))} rotuloCada={1} altura={110} />
          </Caixa>
        </div>

        <Caixa titulo="Eventos mais vistos">
          {r.topEv.length === 0 ? <Vazio /> : (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-semibold">Evento</th><th className="py-2 text-right font-semibold">Vistas</th><th className="py-2 text-right font-semibold">Pessoas</th>
                  <th className="py-2 text-right font-semibold">Ingresso</th><th className="py-2 text-right font-semibold">Agenda</th><th className="py-2 text-right font-semibold">Compart.</th></tr></thead>
                <tbody>{r.topEv.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="max-w-[240px] truncate py-2 pr-2"><Link className="font-semibold hover:text-brand-ink" to={`/evento/${t.id}`}>{t.ev?.titulo || t.id}</Link></td>
                    <td className="py-2 text-right tabular-nums">{fmt(t.vistas)}</td><td className="py-2 text-right tabular-nums">{fmt(t.pessoas)}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(t.ingresso)}</td><td className="py-2 text-right tabular-nums">{fmt(t.agenda)}</td><td className="py-2 text-right tabular-nums">{fmt(t.compart)}</td>
                  </tr>))}</tbody>
              </table>
            </div>)}
        </Caixa>

        <div className="grid gap-x-4 md:grid-cols-2">
          <Caixa titulo="De onde vieram" sub="Por visita">
            <Barras itens={r.origem.map(([k, v]) => [ORIGENS[k] || k, v])} />
          </Caixa>
          <Caixa titulo="Caminho até o ingresso" sub="Pessoas únicas">
            <Barras itens={r.funil} total={r.funil[0][1]} />
          </Caixa>
          <Caixa titulo="Tipo de evento mais visto">
            <Barras itens={r.vistasCat.map(([k, v]) => [CATEGORIAS.find((c) => c.id === k)?.nome || k, v])} />
          </Caixa>
          <Caixa titulo="Aparelho" sub="Por visita">
            <Barras itens={r.disp.map(([k, v]) => [k[0].toUpperCase() + k.slice(1), v])} />
          </Caixa>
          <Caixa titulo="Botões mais clicados">
            <Barras itens={r.acoes.map(([k, v]) => [ACOES[k] || k, v])} />
          </Caixa>
          <Caixa titulo="Filtros mais usados">
            <Barras itens={r.filtros} />
          </Caixa>
        </div>
      </>)}
    </div>
  )
}

// Topo do painel: o que precisa de atenção na agenda
function Resumo({ eventos }) {
  const agora = new Date()
  const pend = eventos.filter((e) => e.status === 'pendente').length
  const prox = eventos.filter((e) => e.status === 'publicado' && (e.fim || e.inicio) >= agora)
  const semana = prox.filter((e) => e.inicio - agora < 7 * 86400000).length
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Link to="/admin/eventos?aba=pendente" className={`rounded-2xl border p-4 transition hover:border-brand ${pend ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'}`}>
        <p className="flex items-center gap-1.5 text-sm font-semibold"><Inbox className="size-4" aria-hidden /> Esperando aprovação</p>
        <p className="mt-1 font-display text-4xl tabular-nums">{pend}</p>
        <p className="text-xs opacity-80">{pend ? 'Toque para revisar' : 'Nada pendente'}</p>
      </Link>
      <Link to="/admin/eventos" className="rounded-2xl border border-line bg-surface p-4 transition hover:border-brand">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-muted"><CalendarDays className="size-4 text-brand-ink" aria-hidden /> Na agenda</p>
        <p className="mt-1 font-display text-4xl tabular-nums">{prox.length}</p>
        <p className="text-xs text-muted">{semana} nos próximos 7 dias</p>
      </Link>
      <Link to="/admin/evento/novo" className="flex items-center justify-center gap-2 rounded-2xl bg-brand p-4 font-display text-2xl uppercase text-on-brand transition hover:bg-brand-strong">
        <Plus className="size-6" aria-hidden /> Novo evento
      </Link>
    </div>
  )
}

function Numero({ Icone, rotulo, valor, sub }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-muted"><Icone className="size-4 text-brand-ink" aria-hidden /> {rotulo}</p>
      <p className="mt-1 font-display text-4xl tabular-nums">{fmt(valor)}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )
}

function Caixa({ titulo, sub, children }) {
  return (
    <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <h2 className="font-display text-xl uppercase">{titulo}</h2>
      {sub && <p className="-mt-0.5 mb-1 text-xs text-muted">{sub}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

const Vazio = () => <p className="text-sm text-muted">Sem dados ainda.</p>

// Escala "redonda" para o eixo: 0, 2, 4, 6... ou 0, 5, 10... (sempre números inteiros)
function escala(max) {
  const bruto = Math.max(1, max) / 4
  const pot = 10 ** Math.floor(Math.log10(bruto))
  const passo = Math.max(1, [1, 2, 5, 10].map((m) => m * pot).find((p) => p >= bruto))
  const topo = Math.max(passo, Math.ceil(Math.max(1, max) / passo) * passo)
  const marcas = []
  for (let v = 0; v <= topo; v += passo) marcas.push(v)
  return { topo, marcas }
}

// Colunas verticais com eixo de valores, linhas de grade, número em cima de cada barra e dica ao tocar
function Colunas({ dados, rotuloCada = 1, altura = 160 }) {
  const [ativo, setAtivo] = useState(null)
  const max = Math.max(0, ...dados.map((d) => d.valor))
  const { topo, marcas } = escala(max)
  const a = ativo != null ? dados[ativo] : null
  // Número em cima da barra só quando cabe (poucas barras); nas outras o eixo e o toque mostram o valor
  const numeroNaBarra = dados.length <= 14
  return (
    <div>
      <p className="mb-1 h-5 truncate text-sm font-semibold tabular-nums text-ink">{a ? `${a.rotulo} · ${a.dica}` : <span className="font-normal text-muted">Toque numa barra para ver o detalhe</span>}</p>
      <div className="mt-3 flex gap-1.5">
        {/* Eixo de valores */}
        <div className="relative w-7 shrink-0 text-right text-[10px] tabular-nums text-muted" style={{ height: altura }} aria-hidden>
          {marcas.map((m) => (
            <span key={m} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(m / topo) * 100}%` }}>{fmt(m)}</span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: altura }} onMouseLeave={() => setAtivo(null)}>
            {/* Linhas de grade */}
            {marcas.map((m) => (
              <div key={m} aria-hidden className={`pointer-events-none absolute inset-x-0 border-t ${m === 0 ? 'border-line' : 'border-dashed border-line/70'}`} style={{ bottom: `${(m / topo) * 100}%` }} />
            ))}
            <div className="relative flex h-full items-end gap-[2px]">
              {dados.map((d, i) => (
                <button key={i} type="button" aria-label={`${d.rotulo}: ${d.dica}`} onMouseEnter={() => setAtivo(i)} onFocus={() => setAtivo(i)} onClick={() => setAtivo(i)}
                  className="group relative flex h-full min-w-0 flex-1 items-end">
                  {numeroNaBarra && d.valor > 0 && (
                    <span className="pointer-events-none absolute inset-x-0 text-center text-[10px] font-semibold leading-none tabular-nums text-ink"
                      style={{ bottom: `calc(${(d.valor / topo) * 100}% + 3px)` }}>{fmt(d.valor)}</span>
                  )}
                  <span className={`block w-full rounded-t-[4px] ${ativo === i ? 'bg-brand-strong' : 'bg-brand'} ${d.valor ? '' : 'opacity-0'}`}
                    style={{ height: `${Math.max(d.valor ? 2 : 0, (d.valor / topo) * 100)}%` }} />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1 flex gap-[2px] text-[10px] text-muted">
            {dados.map((d, i) => <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">{i % rotuloCada === 0 ? d.rotulo : ''}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// Barras horizontais com nome e número
function Barras({ itens, total }) {
  if (!itens.length) return <Vazio />
  const base = total || Math.max(...itens.map(([, v]) => v))
  const soma = itens.reduce((s, [, v]) => s + v, 0)
  return (
    <ul className="space-y-2.5">
      {itens.slice(0, 8).map(([nome, v]) => (
        <li key={nome}>
          <div className="flex justify-between gap-2 text-sm"><span className="truncate">{nome}</span>
            <span className="shrink-0 tabular-nums text-muted">{fmt(v)} · {Math.round((v / (total || soma || 1)) * 100)}%</span></div>
          <div className="mt-1 h-2 rounded-full bg-surface-2"><div className="h-2 rounded-full bg-brand" style={{ width: `${base ? (v / base) * 100 : 0}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}
