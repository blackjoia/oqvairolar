import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Topo from '../components/Topo'
import { Rodape } from './Inicio'
import { BotaoGoogle } from './MeusRoles'
import { useAuth } from '../lib/auth'
import { useAmigos } from '../lib/amigos-ctx'
import { buscarPessoas, aceitarAmizade, desfazerAmizade, pedirAmizade } from '../lib/amigos'
import { clique } from '../lib/visitas'
import { ArrowLeft, Search, Share2, Check, X, UserPlus, Clock, LoaderCircle, Users } from 'lucide-react'

function Foto({ p, className = 'size-12' }) {
  return p.foto
    ? <img src={p.foto} alt="" referrerPolicy="no-referrer" className={`${className} shrink-0 rounded-full object-cover`} />
    : <span className={`${className} grid shrink-0 place-items-center rounded-full bg-surface-2 font-display text-xl`}>{p.nome?.[0]}</span>
}

function Linha({ p, children, sub }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
      <Link to={`/u/${p.uid}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Foto p={p} />
        <span className="min-w-0"><b className="block truncate">{p.nome}</b>{sub && <span className="block truncate text-sm text-muted">{sub}</span>}</span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </li>
  )
}

export default function Amigos() {
  const { usuario, carregando } = useAuth()
  const { amigos, recebidos, enviados, pessoas, vao, pronto, recarregar } = useAmigos()
  const [busca, setBusca] = useState('')
  const [achados, setAchados] = useState(null)
  const [ocupado, setOcupado] = useState('')
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!usuario || busca.trim().length < 2) { setAchados(null); return }
    const t = setTimeout(() => buscarPessoas(busca, usuario.uid).then(setAchados).catch((e) => { console.warn(e); setAchados([]) }), 300)
    return () => clearTimeout(t)
  }, [busca, usuario?.uid])

  const agir = async (uid, acao) => {
    setOcupado(uid); setErro('')
    try { await acao(usuario.uid, uid); await recarregar() } catch (e) { console.warn(e); setErro('Não deu agora. Tente de novo em instantes.') }
    setOcupado('')
  }
  const convidar = async () => {
    const url = `${location.origin}/u/${usuario.uid}?o=convite-amigo`
    const texto = `Me adiciona no O Que Vai Rolar? pra gente ver os rolês um do outro: ${url}`
    clique('convidar-amigo')
    if (navigator.share) { try { await navigator.share({ title: 'O Que Vai Rolar?', text: texto }); return } catch { return } }
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2500) }
    catch { window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank') }
  }

  if (carregando) return (<><Topo /><main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-16"><div className="esqueleto h-40 rounded-2xl" /></main></>)
  if (!usuario) return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 pb-20 pt-10">
        <h1 className="font-display text-5xl uppercase leading-none">Amigos</h1>
        <p className="mt-3 max-w-md text-muted">Entre com a sua conta do Google para adicionar amigos e ver em quais rolês eles vão.</p>
        <BotaoGoogle className="mt-5" />
      </main><Rodape /></>
  )

  const giro = (uid) => ocupado === uid && <LoaderCircle className="size-4 animate-spin" aria-hidden />
  const quantos = (uid) => Object.values(vao).filter((l) => l.some((p) => p.uid === uid)).length
  const naLista = (uid) => amigos.includes(uid) ? 'amigos' : enviados.includes(uid) ? 'enviado' : recebidos.includes(uid) ? 'recebido' : null

  return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-3xl px-4 pb-20 pt-4">
        <Link to="/meus-roles" className="link-toque -my-2 gap-1 text-sm font-semibold text-brand-ink"><ArrowLeft className="size-4" aria-hidden /> Meus rolês</Link>
        <h1 className="mt-4 font-display text-5xl uppercase leading-none">Amigos</h1>
        <p className="mt-2 max-w-md text-muted">Veja em quais rolês seus amigos vão. Eles aparecem primeiro nos eventos e nos cards da agenda.</p>

        {recebidos.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-2xl uppercase">Pedidos para você <span className="ml-1 rounded-full bg-accent px-2 align-middle font-sans text-sm font-bold text-on-accent">{recebidos.length}</span></h2>
            <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
              {recebidos.map((uid) => pessoas[uid] && (
                <Linha key={uid} p={pessoas[uid]} sub="pedido de amizade">
                  <button onClick={() => agir(uid, aceitarAmizade)} disabled={!!ocupado} className="btn-brand px-3 py-2 text-sm">{giro(uid) || <Check className="size-4" aria-hidden />} Aceitar</button>
                  <button onClick={() => agir(uid, desfazerAmizade)} disabled={!!ocupado} aria-label="Recusar" className="btn-ghost size-10 p-0"><X className="size-4" aria-hidden /></button>
                </Linha>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Procurar pelo nome</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Procurar pelo nome" autoComplete="off"
              className="h-12 w-full rounded-2xl border border-campo bg-surface pl-11 pr-4 text-base outline-none focus:border-brand" />
          </label>
          <button onClick={convidar} className="btn-accent h-12 px-5 text-sm">{copiado ? <><Check className="size-4" aria-hidden /> Convite copiado</> : <><Share2 className="size-4" aria-hidden /> Convidar amigos</>}</button>
        </section>
        {achados && (
          <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2" aria-live="polite">
            {achados.length === 0 && <li className="text-sm text-muted">Ninguém com esse nome por aqui. Mande o convite: quem tem o perfil fechado só aparece pelo link.</li>}
            {achados.map((p) => {
              const s = naLista(p.uid)
              return (
                <Linha key={p.uid} p={p}>
                  {s === 'amigos' ? <span className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-on-accent">Amigos</span>
                    : s === 'enviado' ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-muted"><Clock className="size-4" aria-hidden /> Enviado</span>
                    : s === 'recebido' ? <button onClick={() => agir(p.uid, aceitarAmizade)} disabled={!!ocupado} className="btn-brand px-3 py-2 text-sm">{giro(p.uid) || <Check className="size-4" aria-hidden />} Aceitar</button>
                    : <button onClick={() => agir(p.uid, pedirAmizade)} disabled={!!ocupado} className="btn-brand px-3 py-2 text-sm">{giro(p.uid) || <UserPlus className="size-4" aria-hidden />} Adicionar</button>}
                </Linha>
              )
            })}
          </ul>
        )}
        {erro && <p className="mt-2 text-sm text-danger" role="alert">{erro}</p>}

        <section className="mt-8">
          <h2 className="font-display text-2xl uppercase">Meus amigos{amigos.length > 0 && <span className="ml-2 font-sans text-base text-muted">{amigos.length}</span>}</h2>
          {!pronto ? <div className="esqueleto mt-3 h-20 rounded-2xl" />
            : amigos.length ? (
              <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                {amigos.map((uid) => pessoas[uid] && <Linha key={uid} p={pessoas[uid]} sub={quantos(uid) ? `vai em ${quantos(uid)} ${quantos(uid) === 1 ? 'rolê' : 'rolês'}` : 'nenhum rolê marcado'} />)}
              </ul>)
            : <div className="mt-3 flex items-start gap-3 rounded-2xl border border-dashed border-line p-4 text-sm text-muted"><Users className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p>Ainda sem amigos por aqui. Procure pelo nome, toque num rostinho em “quem vai” de um evento ou mande o convite pelo WhatsApp.</p></div>}
        </section>

        {enviados.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl uppercase text-muted">Pedidos enviados</h2>
            <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
              {enviados.map((uid) => pessoas[uid] && (
                <Linha key={uid} p={pessoas[uid]} sub="esperando aceitar">
                  <button onClick={() => agir(uid, desfazerAmizade)} disabled={!!ocupado} className="text-sm font-semibold text-muted underline underline-offset-2">{giro(uid) || 'Cancelar'}</button>
                </Linha>
              ))}
            </ul>
          </section>
        )}
      </main><Rodape /></>
  )
}
