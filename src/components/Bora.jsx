import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hand, Check, LoaderCircle, X, UserPlus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useAmigos } from '../lib/amigos-ctx'
import { convidar, jaConvidei } from '../lib/amigos'

function Foto({ p }) {
  return p.foto ? <img src={p.foto} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full object-cover" />
    : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-lg">{p.nome?.[0]}</span>
}

// "Bora?": chama amigos para este rolê. O convite aparece para eles no app (bolinha na conta e no evento).
export default function Bora({ evento: e }) {
  const { usuario } = useAuth()
  const { amigos, pessoas, vao } = useAmigos()
  const [aberto, setAberto] = useState(false)
  const [marcados, setMarcados] = useState([])
  const [chamados, setChamados] = useState([])
  const [estado, setEstado] = useState('')
  useEffect(() => { if (aberto && usuario) jaConvidei(e.id, usuario.uid).then(setChamados) }, [aberto, e.id, usuario?.uid])
  if (!usuario || !amigos.length) return null

  const vaoIds = (vao[e.id] || []).map((p) => p.uid)
  const lista = amigos.map((u) => pessoas[u]).filter(Boolean).sort((a, b) => a.nome.localeCompare(b.nome))
  const alternar = (uid) => setMarcados((m) => m.includes(uid) ? m.filter((x) => x !== uid) : [...m, uid])
  const enviar = async () => {
    setEstado('indo')
    try { await convidar(e.id, usuario.uid, marcados); setChamados((c) => [...c, ...marcados]); setMarcados([]); setEstado('ok') }
    catch (x) { console.warn(x); setEstado('erro') }
  }

  if (!aberto) return (
    <button onClick={() => { setAberto(true); setEstado('') }} className="btn-brand mt-2 w-full py-3">
      <Hand className="size-5" aria-hidden /> Bora? Chamar amigos
    </button>
  )
  return (
    <div className="mt-2 rounded-2xl border-2 border-brand bg-surface p-3">
      <div className="flex items-center justify-between">
        <b>Chamar para esse rolê</b>
        <button onClick={() => setAberto(false)} aria-label="Fechar" className="grid size-9 place-items-center rounded-full hover:bg-surface-2"><X className="size-4" aria-hidden /></button>
      </div>
      <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
        {lista.map((p) => {
          const vai = vaoIds.includes(p.uid), chamado = chamados.includes(p.uid), marcado = marcados.includes(p.uid)
          const travado = vai || chamado
          return (
            <li key={p.uid}>
              <label className={`flex items-center gap-3 rounded-xl p-2 ${travado ? 'opacity-60' : 'cursor-pointer hover:bg-surface-2'}`}>
                <Foto p={p} />
                <span className="min-w-0 flex-1 truncate font-semibold">{p.nome}</span>
                {vai ? <span className="text-sm font-semibold text-brand-ink">já vai</span>
                  : chamado ? <span className="flex items-center gap-1 text-sm text-muted"><Check className="size-4" aria-hidden /> chamado</span>
                  : <input type="checkbox" checked={marcado} onChange={() => alternar(p.uid)} className="size-5 accent-[var(--brand)]" />}
              </label>
            </li>
          )
        })}
      </ul>
      {estado === 'ok' && <p className="mt-2 text-sm font-semibold text-brand-ink" role="status">Pronto! Eles vão ver o seu convite no app.</p>}
      {estado === 'erro' && <p className="mt-2 text-sm text-danger" role="alert">Não deu para chamar agora. Tente de novo.</p>}
      <div className="mt-2 flex items-center gap-2">
        <button onClick={enviar} disabled={!marcados.length || estado === 'indo'} className="btn-brand flex-1 py-3">
          {estado === 'indo' ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Hand className="size-5" aria-hidden />}
          {marcados.length ? `Chamar ${marcados.length}` : 'Escolha quem chamar'}
        </button>
        <Link to="/amigos" className="btn-ghost px-3 py-3" aria-label="Adicionar amigos"><UserPlus className="size-5" aria-hidden /></Link>
      </div>
    </div>
  )
}
