import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { registrar } from './lib/visitas'
import './index.css'
import { AuthProvider } from './lib/auth'
import Inicio from './pages/Inicio'
import Evento from './pages/Evento'
const Divulgar = lazy(() => import('./pages/Divulgar'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const Lista = lazy(() => import('./pages/admin/Lista'))
const FormEvento = lazy(() => import('./pages/admin/FormEvento'))
import InstalarApp from './components/InstalarApp'
const Estatisticas = lazy(() => import('./pages/admin/Estatisticas'))

// Service worker: permite instalar como app (substitui o do site antigo).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
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

function NaoEncontrado() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="font-display text-6xl uppercase text-brand">404</p>
      <p className="mt-2 text-muted">Essa página não existe.</p>
      <Link to="/" className="btn-brand mt-6">Ver a agenda</Link>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ContarVisitas />
        <InstalarApp />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/evento/:id" element={<Evento />} />
          <Route path="/divulgar" element={<Divulgar />} />
          <Route path="/admin" element={<Admin />}>
            <Route index element={<Estatisticas />} />
            <Route path="eventos" element={<Lista />} />
            <Route path="estatisticas" element={<Navigate to="/admin" replace />} />
            <Route path="evento/:id" element={<FormEvento />} />
          </Route>
          {import.meta.env.DEV && <Route path="/dev-estatisticas" element={<main className="mx-auto max-w-5xl px-4 py-4"><Estatisticas /></main>} />}
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
