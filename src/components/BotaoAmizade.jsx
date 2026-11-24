import { useEffect, useState } from 'react'
import { UserPlus, UserCheck, Clock, LoaderCircle, Check, X } from 'lucide-react'
import { useAuth, entrarComGoogle } from '../lib/auth'
import { useAmigos } from '../lib/amigos-ctx'
import { situacaoCom, pedirAmizade, aceitarAmizade, desfazerAmizade } from '../lib/amigos'

// Botão de amizade no perfil de alguém: Adicionar · Pedido enviado · Aceitar/Recusar · Amigos.
export default function BotaoAmizade({ uid, nome, className = '' }) {
  const { usuario } = useAuth()
  const { recarregar } = useAmigos()
  const [sit, setSit] = useState(undefined)
  const [indo, setIndo] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  useEffect(() => { if (usuario && usuario.uid !== uid) situacaoCom(usuario.uid, uid).then(setSit); else setSit(null) }, [usuario?.uid, uid])
  if (usuario?.uid === uid) return null

  const fazer = async (acao, nova) => {
    setIndo(true); setErro('')
    try { await acao(usuario.uid, uid); setSit(nova); setConfirmar(false); recarregar() }
    catch (e) { console.warn(e); setErro('Não deu agora. Tente de novo em instantes.') }
    setIndo(false)
  }
  const primeiro = (nome || '').split(' ')[0]
  const giro = indo && <LoaderCircle className="size-4 animate-spin" aria-hidden />

  if (!usuario) return (
    <button onClick={() => entrarComGoogle().catch((x) => setErro(x.message))} className={`btn-brand px-4 py-2.5 text-sm ${className}`}>
      <UserPlus className="size-4" aria-hidden /> Entrar para adicionar{erro && <span className="sr-only">{erro}</span>}
    </button>
  )
  if (sit === undefined) return <span className={`esqueleto inline-block h-10 w-40 rounded-full ${className}`} />
  return (
    <div className={className}>
      {sit === null && <button onClick={() => fazer(pedirAmizade, 'enviado')} disabled={indo} className="btn-brand px-4 py-2.5 text-sm">{giro || <UserPlus className="size-4" aria-hidden />} Adicionar amigo</button>}
      {sit === 'enviado' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2.5 text-sm font-semibold"><Clock className="size-4" aria-hidden /> Pedido enviado</span>
          <button onClick={() => fazer(desfazerAmizade, null)} disabled={indo} className="text-sm font-semibold text-muted underline underline-offset-2">Cancelar</button>
        </div>
      )}
      {sit === 'recebido' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-sm text-muted">{primeiro || 'Essa pessoa'} te mandou um pedido de amizade.</span>
          <button onClick={() => fazer(aceitarAmizade, 'amigos')} disabled={indo} className="btn-brand px-4 py-2.5 text-sm">{giro || <Check className="size-4" aria-hidden />} Aceitar</button>
          <button onClick={() => fazer(desfazerAmizade, null)} disabled={indo} className="btn-ghost px-4 py-2.5 text-sm"><X className="size-4" aria-hidden /> Recusar</button>
        </div>
      )}
      {sit === 'amigos' && (confirmar
        ? <div className="flex flex-wrap items-center gap-2"><span className="text-sm">Desfazer a amizade com {primeiro}?</span>
            <button onClick={() => fazer(desfazerAmizade, null)} disabled={indo} className="btn-ghost px-3 py-2 text-sm text-danger">{giro} Desfazer</button>
            <button onClick={() => setConfirmar(false)} className="text-sm font-semibold text-muted underline underline-offset-2">Manter</button></div>
        : <button onClick={() => setConfirmar(true)} className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-on-accent"><UserCheck className="size-4" aria-hidden /> Amigos</button>)}
      {erro && <p className="mt-1 text-sm text-danger" role="alert">{erro}</p>}
    </div>
  )
}
