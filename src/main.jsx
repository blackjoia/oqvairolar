import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth'
import Inicio from './pages/Inicio'
import Evento from './pages/Evento'
const Divulgar = lazy(() => import('./pages/Divulgar'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const Lista = lazy(() => import('./pages/admin/Lista'))
const FormEvento = lazy(() => import('./pages/admin/FormEvento'))

// Remove o service worker do site antigo, se ainda estiver instalado.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()))
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
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/evento/:id" element={<Evento />} />
          <Route path="/divulgar" element={<Divulgar />} />
          <Route path="/admin" element={<Admin />}>
            <Route index element={<Lista />} />
            <Route path="evento/:id" element={<FormEvento />} />
          </Route>
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
