import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Cartaz from '../../components/Cartaz'
import { Download, MoreHorizontal, Plus } from 'lucide-react'
import { listarTodos, mudarStatus, apagarEvento, criarEvento } from '../../lib/eventos'
import { diaMes, mesCurto, hora, diaSemana } from '../../lib/datas'
import { STATUS } from '../../lib/constantes'

const ABAS = [
  { id: 'proximos', nome: 'Próximos' },
  { id: 'pendente', nome: 'Pendentes' },
  { id: 'rascunho', nome: 'Ocultos' },
  { id: 'passados', nome: 'Passados' },
]

export default function Lista() {
  const [eventos, setEventos] = useState(null)
  const [aba, setAba] = useState('proximos')
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')

  const carregar = () => listarTodos().then(setEventos).catch((e) => { console.error(e); setErro('Erro ao carregar eventos: ' + e.message) })
  useEffect(() => { carregar() }, [])

  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const contagem = useMemo(() => {
    const c = { proximos: 0, pendente: 0, rascunho: 0, passados: 0 }
    ;(eventos || []).forEach((e) => {
      if (e.status === 'pendente') c.pendente++
      else if (e.status === 'rascunho' || e.status === 'rejeitado') c.rascunho++
      else if (e.inicio >= hoje) c.proximos++
      else c.passados++
    })
    return c
  }, [eventos])

  const lista = useMemo(() => {
    const b = busca.trim().toLowerCase()
    let l = (eventos || []).filter((e) => {
      if (aba === 'pendente') return e.status === 'pendente'
      if (aba === 'rascunho') return e.status === 'rascunho' || e.status === 'rejeitado'
      if (e.status !== 'publicado') return false
      return aba === 'proximos' ? e.inicio >= hoje : e.inicio < hoje
    })
    if (b) l = l.filter((e) => [e.titulo, e.localNome, e.cidade].join(' ').toLowerCase().includes(b))
    return aba === 'passados' ? l : [...l].sort((a, z) => a.inicio - z.inicio)
  }, [eventos, aba, busca])

  const acao = async (fn) => { try { await fn(); await carregar() } catch (e) { alert('Erro: ' + e.message) } }

  const duplicar = (e) => acao(async () => {
    const { id, criadoEm, atualizadoEm, ...resto } = e
    await criarEvento({ ...resto, titulo: e.titulo + ' (cópia)', status: 'rascunho' })
    setAba('rascunho')
  })

  const backup = () => {
    const dados = (eventos || []).map((e) => ({ ...e, inicio: e.inicio?.toISOString(), fim: e.fim?.toISOString() || null, criadoEm: e.criadoEm?.toDate?.().toISOString(), atualizadoEm: e.atualizadoEm?.toDate?.().toISOString() }))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }))
    a.download = `backup-eventos-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl uppercase">Eventos</h1>
        <div className="flex gap-2">
          <button onClick={backup} className="btn-ghost text-sm"><Download className="size-4" /> Backup</button>
          <Link to="/admin/evento/novo" className="btn-brand text-sm"><Plus className="size-4" /> Novo evento</Link>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)} className={`chip ${aba === a.id ? 'chip-on' : ''}`}>
            {a.nome} <span className="ml-1 opacity-70">{contagem[a.id]}</span>
          </button>
        ))}
      </div>
      <input className="campo mt-3" placeholder="Buscar por nome, local ou cidade" value={busca} onChange={(e) => setBusca(e.target.value)} />

      {erro && <p className="mt-4 rounded-xl bg-danger/10 p-3 text-danger">{erro}</p>}
      {!eventos && !erro && <p className="mt-6 text-muted">Carregando…</p>}
      {eventos && lista.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-muted">Nenhum evento aqui.</p>}

      <ul className="mt-4 space-y-2">
        {lista.map((e) => (
          <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
            <Cartaz evento={e} className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted">
                <span>{diaSemana(e.inicio)} {diaMes(e.inicio)} {mesCurto(e.inicio)} · {hora(e.inicio)}</span>
                <span className={`rounded-full px-2 py-0.5 normal-case ${STATUS[e.status]?.cor || ''}`}>{STATUS[e.status]?.nome || e.status}</span>
              </div>
              <Link to={`/admin/evento/${e.id}`} className="block truncate font-bold hover:text-brand">{e.titulo}</Link>
              <p className="truncate text-sm text-muted">{[e.localNome, e.cidade].filter(Boolean).join(' · ')}</p>
              {e.enviadoPor && <p className="truncate text-xs text-muted">Enviado por {e.enviadoPor.nome} · {e.enviadoPor.contato}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
              {e.status !== 'publicado'
                ? <button onClick={() => acao(() => mudarStatus(e.id, 'publicado'))} className="btn-accent px-3 py-1.5 text-sm">Publicar</button>
                : <button onClick={() => acao(() => mudarStatus(e.id, 'rascunho'))} className="btn-ghost px-3 py-1.5 text-sm">Ocultar</button>}
              <details className="relative">
                <summary className="btn-ghost cursor-pointer list-none px-2.5 py-1.5 text-sm" aria-label="Mais ações"><MoreHorizontal className="size-4" /></summary>
                <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                  <Link to={`/admin/evento/${e.id}`} className="block px-3 py-2 text-sm hover:bg-surface-2">Editar</Link>
                  <Link to={`/evento/${e.id}`} className="block px-3 py-2 text-sm hover:bg-surface-2">Ver página</Link>
                  <button onClick={() => duplicar(e)} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2">Duplicar</button>
                  {e.status === 'pendente' && <button onClick={() => acao(() => mudarStatus(e.id, 'rejeitado'))} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-2">Rejeitar</button>}
                  <button onClick={() => confirm(`Apagar "${e.titulo}"? Não dá para desfazer.`) && acao(() => apagarEvento(e.id))}
                    className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-surface-2">Apagar</button>
                </div>
              </details>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
