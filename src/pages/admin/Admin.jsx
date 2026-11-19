import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Topo from '../../components/Topo'
import { useAuth, entrar, sair, recuperarSenha } from '../../lib/auth'
import AvisosAdmin, { useAppAdmin } from '../../components/AvisosAdmin'

// Protege todas as páginas /admin
export default function Admin() {
  const { user, isAdmin, carregando } = useAuth()
  useAppAdmin()
  if (carregando) return <Topo />
  if (!user) return <Login />
  if (!isAdmin) return (
    <><Topo />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-3xl uppercase">Sem acesso</p>
        <p className="mt-2 text-muted">A conta {user.email} não é administradora.</p>
        <button onClick={sair} className="btn-ghost mt-6">Sair</button>
      </main></>
  )
  try { localStorage.setItem('naoContar', '1') } catch {} // este aparelho não entra nas estatísticas
  return (
    <>
      <Topo>
        <span className="hidden rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-on-accent sm:inline">ADMIN</span>
        <button onClick={sair} className="btn-ghost py-2 text-sm">Sair</button>
      </Topo>
      <MenuAdmin />
      <AvisosAdmin uid={user.uid} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4"><Outlet /></main>
    </>
  )
}

function MenuAdmin() {
  const { pathname } = useLocation()
  const itens = [
    { to: '/admin', nome: 'Painel' },
    { to: '/admin/eventos', nome: 'Eventos' },
    { to: '/admin/evento/novo', nome: '+ Novo evento' },
    { to: '/admin/artes', nome: 'Artes' },
    { to: '/admin/pedidos', nome: 'Pedidos' },
    { to: '/', nome: 'Ver site' },
  ]
  return (
    <nav className="border-b border-line bg-surface">
      <div className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {itens.map((i) => (
          <Link key={i.to} to={i.to}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${pathname === i.to ? 'border-brand text-brand-ink' : 'border-transparent text-muted hover:text-ink'}`}>
            {i.nome}
          </Link>
        ))}
      </div>
    </nav>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const enviar = async (ev) => {
    ev.preventDefault(); setEnviando(true); setMsg('')
    try { await entrar(email.trim(), senha) } catch { setMsg('E-mail ou senha incorretos.') }
    setEnviando(false)
  }
  const esqueci = async () => {
    if (!email) return setMsg('Digite seu e-mail primeiro.')
    try { await recuperarSenha(email.trim()); setMsg('Se a conta existir, enviamos um link para redefinir a senha.') } catch { setMsg('Não foi possível enviar o e-mail.') }
  }
  return (
    <><Topo />
      <main className="mx-auto max-w-sm px-4 py-14">
        <h1 className="font-display text-4xl uppercase">Painel <span className="text-brand-ink">admin</span></h1>
        <form onSubmit={enviar} className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-5">
          <label className="block"><span className="rotulo">E-mail</span>
            <input className="campo" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="block"><span className="rotulo">Senha</span>
            <input className="campo" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required /></label>
          {msg && <p className="text-sm font-semibold text-danger">{msg}</p>}
          <button disabled={enviando} className="btn-brand w-full">{enviando ? 'Entrando…' : 'Entrar'}</button>
          <button type="button" onClick={esqueci} className="w-full text-sm font-semibold text-muted hover:text-brand-ink">Esqueci a senha</button>
        </form>
      </main></>
  )
}
