import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import { Rodape } from './Inicio'
import { useAuth, entrarComGoogle, sair } from '../lib/auth'
import { buscarEvento } from '../lib/eventos'
import { minhasPresencas, quemSigo, salvarUsuario, atualizarVisibilidade, registrarAparelho } from '../lib/social'
import { CalendarHeart, Bell, BadgeCheck, LogOut, Users, Store, LoaderCircle, Star, PartyPopper } from 'lucide-react'

function Google() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  )
}

export function BotaoGoogle({ className = '' }) {
  const [erro, setErro] = useState(''); const [indo, setIndo] = useState(false)
  return (
    <div className={className}>
      <button onClick={async () => { setErro(''); setIndo(true); try { await entrarComGoogle() } catch (x) { setErro(x.message) } setIndo(false) }}
        disabled={indo} className="btn-ghost w-full py-3 text-base sm:w-auto sm:px-6">
        {indo ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Google />} Entrar com Google
      </button>
      {erro && <p className="mt-2 text-sm text-danger">{erro}</p>}
    </div>
  )
}

export default function MeusRoles() {
  const { usuario, perfis, carregando, recarregar } = useAuth()
  const [eventos, setEventos] = useState(null)
  const [sigo, setSigo] = useState([])
  const [avisos, setAvisos] = useState({ estado: '', erro: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!usuario) return
    minhasPresencas(usuario.uid).then(async (ps) => {
      const evs = await Promise.all(ps.map(async (p) => { const e = await buscarEvento(p.eventoId).catch(() => null); return e && { ...e, minha: p.tipo } }))
      const agora = Date.now()
      setEventos(evs.filter(Boolean).filter((e) => (e.fim || e.inicio).getTime() > agora - 6 * 3600000).sort((a, b) => a.inicio - b.inicio))
    }).catch(() => setEventos([]))
    quemSigo(usuario.uid).then(setSigo)
  }, [usuario?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const alternarPublico = async () => {
    setSalvando(true)
    try { await salvarUsuario(usuario.uid, { publico: !usuario.publico }); await atualizarVisibilidade(usuario.uid, !usuario.publico); await recarregar() } catch {}
    setSalvando(false)
  }
  const ligarAvisos = async () => {
    setAvisos({ estado: 'indo', erro: '' })
    try { await registrarAparelho(usuario.uid); setAvisos({ estado: 'ok', erro: '' }) } catch (x) { setAvisos({ estado: '', erro: x.message }) }
  }

  if (carregando) return (<><Topo /><main className="mx-auto max-w-5xl px-4 py-16"><div className="esqueleto h-40 rounded-2xl" /></main></>)

  if (!usuario) return (
    <><Topo />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-10">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Sua conta</p>
        <h1 className="mt-3 font-display text-[clamp(3rem,10vw,5.5rem)] uppercase leading-[.9]">Seus rolês<br />num lugar <span className="rounded-lg bg-accent px-2 text-on-accent">só</span></h1>
        <p className="mt-4 max-w-lg text-muted">Entre com a sua conta do Google, de graça e sem senha nova. O que você já marcou neste aparelho vem junto.</p>
        <ul className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
          {[[CalendarHeart, 'Os eventos que você marcou', 'Eu vou e Interesse aparecem em qualquer aparelho.'],
            [Users, 'Veja quem vai', 'Se quiser, sua foto aparece em “quem vai” e você vê os amigos.'],
            [Bell, 'Siga bares e bandas', 'Receba um aviso no celular quando sair evento novo.'],
            [Store, 'É dono de bar ou banda?', 'Assuma a página e publique seus eventos direto.']].map(([I, t, d]) => (
            <li key={t} className="flex gap-3 rounded-2xl border border-line bg-surface p-4"><I className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden /><div><b className="text-sm">{t}</b><p className="text-sm text-muted">{d}</p></div></li>
          ))}
        </ul>
        <BotaoGoogle className="mt-6" />
      </main><Rodape /></>
  )

  const vou = (eventos || []).filter((e) => e.minha === 'vou'), interesse = (eventos || []).filter((e) => e.minha === 'interesse')
  return (
    <><Topo />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8">
        <section className="flex flex-wrap items-center gap-4">
          {usuario.foto ? <img src={usuario.foto} alt="" referrerPolicy="no-referrer" className="size-16 rounded-2xl object-cover" /> : <span className="grid size-16 place-items-center rounded-2xl bg-surface-2 font-display text-3xl">{usuario.nome?.[0]}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-widest text-brand">Meus rolês</p>
            <h1 className="truncate font-display text-4xl uppercase leading-none sm:text-5xl">{usuario.nome}</h1>
          </div>
          <button onClick={sair} className="btn-ghost text-sm"><LogOut className="size-4" aria-hidden /> Sair</button>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface p-4">
            <input type="checkbox" checked={!!usuario.publico} onChange={alternarPublico} disabled={salvando} className="mt-1 size-5" />
            <span><b className="text-sm">Aparecer em “quem vai”</b><span className="block text-sm text-muted">Sua foto e seu primeiro nome aparecem nos eventos em que você marcou Eu vou{usuario.publico && <> · <Link className="font-semibold text-brand" to={`/u/${usuario.uid}`}>ver meu perfil</Link></>}.</span></span>
          </label>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <b className="text-sm">Avisos no celular</b>
            <p className="text-sm text-muted">Quando um bar ou banda que você segue postar evento novo.</p>
            {avisos.estado === 'ok' ? <p className="mt-2 text-sm font-semibold text-brand">Avisos ligados neste aparelho.</p>
              : <button onClick={ligarAvisos} disabled={avisos.estado === 'indo'} className="btn-ghost mt-2 text-sm"><Bell className="size-4" aria-hidden /> Ligar avisos</button>}
            {avisos.erro && <p className="mt-1 text-xs text-danger">{avisos.erro}</p>}
          </div>
        </div>

        {perfis.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl uppercase">Minhas páginas</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {perfis.map((p) => (
                <div key={p.slug} className="flex items-center gap-2 rounded-2xl border border-line bg-surface py-2 pl-3 pr-2">
                  <BadgeCheck className="size-5 text-brand" aria-hidden /><Link to={`/local/${p.slug}`} className="font-semibold hover:text-brand">{p.nome}</Link>
                  <Link to={`/divulgar?perfil=${p.slug}`} className="btn-brand ml-2 px-3 py-1.5 text-sm">Publicar evento</Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-2xl uppercase"><PartyPopper className="size-5 text-brand" aria-hidden /> Eu vou</h2>
          {!eventos ? <div className="esqueleto mt-3 h-32 rounded-2xl" />
            : vou.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{vou.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
            : <p className="mt-2 text-muted">Nenhum ainda. <Link to="/" className="font-semibold text-brand">Achar um rolê</Link></p>}
        </section>
        {interesse.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 font-display text-2xl uppercase"><Star className="size-5 text-brand" aria-hidden /> Tenho interesse</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{interesse.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
          </section>
        )}
        <section className="mt-8">
          <h2 className="font-display text-2xl uppercase">Sigo</h2>
          {sigo.length ? <div className="mt-3 flex flex-wrap gap-2">{sigo.map((s) => <Link key={s.slug} to={`/local/${s.slug}`} className="chip">{s.nome}</Link>)}</div>
            : <p className="mt-2 text-muted">Abra a página de um bar ou banda e toque em Seguir.</p>}
        </section>
      </main><Rodape /></>
  )
}
