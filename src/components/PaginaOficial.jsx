import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, entrarComGoogle } from '../lib/auth'
import { buscarPerfil, sigo as jaSigo, contarSeguidores, seguir, deixarDeSeguir, pedirPerfil, meuPedido, registrarAparelho } from '../lib/social'
import { BadgeCheck, Bell, BellRing, Store, LoaderCircle, Plus } from 'lucide-react'

// Na página de um bar/banda: selo de página oficial, botão Seguir e "É o dono? Assuma a página".
export default function PaginaOficial({ slug, nome, tipo }) {
  const { usuario, perfis } = useAuth()
  const [perfil, setPerfil] = useState(undefined)
  const [segue, setSegue] = useState(false)
  const [n, setN] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState(null) // null | { contato, mensagem } | 'enviado'
  const [pedido, setPedido] = useState(null)
  const souDono = perfis.some((p) => p.slug === slug)

  useEffect(() => { buscarPerfil(slug).then(setPerfil); contarSeguidores(slug).then(setN) }, [slug])
  useEffect(() => { if (usuario) { jaSigo(slug, usuario.uid).then(setSegue); meuPedido(slug, usuario.uid).then(setPedido) } }, [slug, usuario?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const precisaConta = async () => { if (usuario) return true; try { await entrarComGoogle() } catch (x) { setErro(x.message) } return false }
  const alternarSeguir = async () => {
    setErro(''); if (!(await precisaConta())) return
    setOcupado(true)
    try {
      if (segue) { await deixarDeSeguir(slug, usuario.uid); setSegue(false); setN((x) => Math.max(0, x - 1)) }
      else {
        await seguir(slug, usuario.uid, perfil?.nome || nome); setSegue(true); setN((x) => x + 1)
        registrarAparelho(usuario.uid).catch(() => {}) // liga o aviso no celular, se der
      }
    } catch { setErro('Não deu agora. Tenta de novo.') }
    setOcupado(false)
  }
  const enviarPedido = async (ev) => {
    ev.preventDefault(); setErro('')
    if (!form.contato.trim()) return setErro('Coloque um WhatsApp ou e-mail para a gente confirmar.')
    setOcupado(true)
    try { await pedirPerfil({ slug, nome: perfil?.nome || nome, tipo, uid: usuario.uid, contato: form.contato.trim(), mensagem: form.mensagem.trim() }); setForm('enviado') }
    catch { setErro('Não deu para enviar o pedido agora.') }
    setOcupado(false)
  }

  return (
    <div className="mt-4">
      {perfil && <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1 text-sm font-bold text-brand"><BadgeCheck className="size-4" aria-hidden /> Página oficial</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={alternarSeguir} disabled={ocupado} aria-pressed={segue} className={segue ? 'btn-ghost' : 'btn-brand'}>
          {ocupado ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : segue ? <BellRing className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
          {segue ? 'Seguindo' : 'Seguir'}{n > 0 && <span className="tabular-nums opacity-75">· {n}</span>}
        </button>
        {souDono && <Link to={`/divulgar?perfil=${slug}`} className="btn-accent"><Plus className="size-5" aria-hidden /> Publicar evento</Link>}
      </div>
      {!segue && <p className="mt-1.5 text-xs text-muted">Siga para receber um aviso no celular quando sair evento novo.</p>}

      {!souDono && (
        <div className="mt-4 border-t border-line pt-4 text-sm">
          {pedido?.status === 'pendente' || form === 'enviado' ? <p className="text-muted">Pedido enviado. Assim que a gente confirmar, você já pode publicar por aqui.</p>
            : form ? (
              <form onSubmit={enviarPedido} className="grid max-w-md gap-2">
                <p className="font-semibold">Assumir a página de {perfil?.nome || nome}</p>
                <input className="campo" placeholder="Seu WhatsApp ou e-mail *" value={form.contato} onChange={(x) => setForm({ ...form, contato: x.target.value })} />
                <textarea className="campo" rows={2} placeholder="Você é dono, sócio, da banda…? (opcional)" value={form.mensagem} onChange={(x) => setForm({ ...form, mensagem: x.target.value })} />
                <div className="flex gap-2"><button type="button" onClick={() => setForm(null)} className="btn-ghost">Cancelar</button><button disabled={ocupado} className="btn-brand flex-1">Enviar pedido</button></div>
              </form>
            ) : (
              <button onClick={async () => { setErro(''); if (await precisaConta()) setForm({ contato: '', mensagem: '' }) }} className="flex items-start gap-2 text-left font-semibold text-brand">
                <Store className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{tipo === 'local' ? 'Este lugar é seu?' : 'Você é da banda ou da produção?'} Assuma esta página e publique seus eventos direto.</span>
              </button>
            )}
        </div>
      )}
      {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
    </div>
  )
}
