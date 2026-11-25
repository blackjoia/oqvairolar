import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { registrar } from './lib/visitas'
import './index.css'
import { AuthProvider, useAuth } from './lib/auth'
import { AmigosProvider } from './lib/amigos-ctx'
import { RANKING_LIGADO } from './lib/recursos'
import Inicio from './pages/Inicio'
import Evento from './pages/Evento'
const Local = lazy(() => import('./pages/Local'))
const Divulgar = lazy(() => import('./pages/Divulgar'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const Lista = lazy(() => import('./pages/admin/Lista'))
const FormEvento = lazy(() => import('./pages/admin/FormEvento'))
import InstalarApp from './components/InstalarApp'
import AbrirNoNavegador from './components/AbrirNoNavegador'
import Aviso from './components/Aviso'
const Artes = lazy(() => import('./pages/admin/Artes'))
const Pedidos = lazy(() => import('./pages/admin/Pedidos'))
const MeusRoles = lazy(() => import('./pages/MeusRoles'))
const Usuario = lazy(() => import('./pages/Usuario'))
const Amigos = lazy(() => import('./pages/Amigos'))
const Semana = lazy(() => import('./pages/Semana'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Estatisticas = lazy(() => import('./pages/admin/Estatisticas'))

// Service worker: permite instalar como app (substitui o do site antigo).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => {
    // App instalado: ao voltar para ele, confere se saiu versão nova do site e recarrega sozinho.
    const versao = document.querySelector('script[type=module][src*="/assets/"]')?.getAttribute('src')
    const conferir = async () => {
      if (document.visibilityState !== 'visible') return
      reg.update().catch(() => {})
      try {
        const html = await (await fetch('/', { cache: 'no-store' })).text()
        if (versao && !html.includes(versao)) location.reload()
      } catch {}
    }
    document.addEventListener('visibilitychange', conferir)
  }).catch(() => {}))
}

// Conta cada página aberta (menos o painel admin).
function ContarVisitas() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    const t = setTimeout(() => registrar('pagina', { eventoId: pathname.startsWith('/evento/') ? pathname.slice(8) : null }), 800)
    return () => clearTimeout(t)
  }, [pathname])
  return null
}

// Comemoração do ranking: confere uma vez quando a pessoa abre o app (só quem entrou com o Google).
const Conquista = lazy(() => import('./components/Conquista'))
function Conquistas() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [c, setC] = useState(null)
  const visto = useRef(false)
  useEffect(() => {
    if (pathname.startsWith('/admin') || visto.current) return
    const demo = new URLSearchParams(location.search).get('conquista')
    if (import.meta.env.DEV && demo) { visto.current = true; import('./lib/conquistas').then((m) => setC(m.conquistaDemo(demo))); return }
    if (!user) return
    visto.current = true
    const t = setTimeout(() => import('./lib/conquistas').then((m) => m.verConquista(user.uid)).then(setC).catch(() => {}), 1500)
    return () => clearTimeout(t)
  }, [user, pathname])
  return c ? <Suspense fallback={null}><Conquista c={c} fechar={() => setC(null)} /></Suspense> : null
}

function NaoEncontrado() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-6xl uppercase text-brand-ink">404</p>
      <p className="mt-2 text-muted">Essa página não existe.</p>
      <Link to="/" className="btn-brand mt-6">Ver a agenda</Link>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AmigosProvider>
      <BrowserRouter>
        <ContarVisitas />
        <AbrirNoNavegador />
        <Aviso />
        <InstalarApp />
        {RANKING_LIGADO && <Conquistas />}
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/evento/:id" element={<Evento />} />
          <Route path="/divulgar" element={<Divulgar />} />
          <Route path="/local/:slug" element={<Local />} />
          <Route path="/meus-roles" element={<MeusRoles />} />
          <Route path="/u/:uid" element={<Usuario />} />
          <Route path="/amigos" element={<Amigos />} />
          <Route path="/semana" element={<Semana />} />
          <Route path="/ranking" element={RANKING_LIGADO ? <Ranking /> : <Navigate to="/" replace />} />
          <Route path="/admin" element={<Admin />}>
            <Route index element={<Estatisticas />} />
            <Route path="eventos" element={<Lista />} />
            <Route path="artes" element={<Artes />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="estatisticas" element={<Navigate to="/admin" replace />} />
            <Route path="evento/:id" element={<FormEvento />} />
          </Route>
          {import.meta.env.DEV && <Route path="/dev-form/:id" element={<main className="mx-auto max-w-5xl px-4 py-4"><FormEvento /></main>} />}
          {import.meta.env.DEV && <Route path="/dev-artes" element={<main className="mx-auto max-w-5xl px-4 py-4"><Artes /></main>} />}
          {import.meta.env.DEV && <Route path="/dev-estatisticas" element={<main className="mx-auto max-w-5xl px-4 py-4"><Estatisticas /></main>} />}
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </AmigosProvider>
    </AuthProvider>
  </StrictMode>,
)
