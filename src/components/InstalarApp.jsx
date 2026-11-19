import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Share, SquarePlus, EllipsisVertical, Download } from 'lucide-react'
import { clique } from '../lib/visitas'

// Convite para salvar o site como app na tela inicial do celular.
let promptGuardado = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptGuardado = e; window.dispatchEvent(new Event('pode-instalar')) })
}

const CHAVE = 'instalarFechadoEm'
const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
const ua = () => navigator.userAgent
const ehIOS = () => /iPhone|iPad|iPod/i.test(ua())
const ehCelular = () => /Android|iPhone|iPad|iPod|Mobi/i.test(ua())
const navegadorDeApp = () => /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|musical_ly|BytedanceWebview|TikTok|Barcelona|LinkedInApp|Line\/|WhatsApp/i.test(ua())
function fechadoRecente() {
  try { return Date.now() - Number(localStorage.getItem(CHAVE) || 0) < 14 * 86400000 } catch { return false }
}

// Abre o convite na hora (usado pelo link "Instalar o app" do rodapé)
export function abrirInstalar() { window.dispatchEvent(new Event('abrir-instalar')) }

// Instalação direta (usada pelo painel admin, que vira um app separado). Devolve false se o navegador não oferece.
export const podeInstalarDireto = () => !!promptGuardado
export async function instalarDireto() {
  if (!promptGuardado) return false
  promptGuardado.prompt()
  const r = await promptGuardado.userChoice.catch(() => null)
  promptGuardado = null
  return r?.outcome === 'accepted'
}
export { instalado as appInstalado, ehIOS as aparelhoIOS }

export default function InstalarApp() {
  const { pathname } = useLocation()
  const [aberto, setAberto] = useState(false)
  const [nativo, setNativo] = useState(!!promptGuardado)

  useEffect(() => {
    const pode = () => setNativo(true)
    const abrir = () => setAberto(true)
    window.addEventListener('pode-instalar', pode)
    window.addEventListener('abrir-instalar', abrir)
    let t
    if (ehCelular() && !instalado() && !navegadorDeApp() && !fechadoRecente() && !pathname.startsWith('/admin')) t = setTimeout(() => setAberto(true), 5000)
    return () => { clearTimeout(t); window.removeEventListener('pode-instalar', pode); window.removeEventListener('abrir-instalar', abrir) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!aberto || instalado()) return null
  const fechar = () => { setAberto(false); try { localStorage.setItem(CHAVE, String(Date.now())) } catch {} }
  const instalar = async () => {
    clique('instalar-app')
    if (!promptGuardado) return
    promptGuardado.prompt()
    const r = await promptGuardado.userChoice.catch(() => null)
    promptGuardado = null; setNativo(false)
    if (r?.outcome === 'accepted') setAberto(false)
  }

  let passos = null
  if (navegadorDeApp()) passos = <p>Abra este site no {ehIOS() ? 'Safari' : 'Chrome'} (toque nos três pontinhos e em <b>Abrir no navegador</b>) para poder instalar.</p>
  else if (ehIOS()) passos = <p className="flex flex-wrap items-center gap-1">Toque em <Share className="inline size-4" aria-label="Compartilhar" /> <b>Compartilhar</b> e depois em <SquarePlus className="inline size-4" aria-hidden /> <b>Adicionar à Tela de Início</b>.</p>
  else if (!nativo) passos = <p className="flex flex-wrap items-center gap-1">Toque no menu <EllipsisVertical className="inline size-4" aria-label="menu" /> do navegador e em <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>.</p>

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm" role="dialog" aria-label="Instalar o app">
      <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-2xl">
        <img src="/icons/icon-192-v2.png" alt="" className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-display text-lg uppercase leading-tight">Tenha o app no celular</p>
          <p className="text-muted">Abra a agenda direto da tela inicial, sem procurar o site.</p>
          {passos ? <div className="mt-2 rounded-xl bg-surface-2 p-2.5 text-ink">{passos}</div>
            : <button onClick={instalar} className="btn-accent mt-3 w-full py-2.5"><Download className="size-4" aria-hidden /> Instalar app</button>}
        </div>
        <button onClick={fechar} aria-label="Fechar" className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2"><X className="size-5" /></button>
      </div>
    </div>
  )
}
