import { useEffect, useState } from 'react'
import { doc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BellRing, Check, Download, Share, X } from 'lucide-react'
import { podeInstalarDireto, instalarDireto, appInstalado, aparelhoIOS } from './InstalarApp'

const CHAVE = 'avisosAdmin'
const ler = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const gravar = (k, v) => { try { localStorage.setItem(k, v) } catch {} }

// O painel admin vira um app separado no celular (ícone "Admin OQVR") e avisa quando chega evento ou pedido novo.
export function useAppAdmin() {
  useEffect(() => {
    const trocar = (sel, attr, valor) => {
      const el = document.querySelector(sel); if (!el) return () => {}
      const antes = el.getAttribute(attr); el.setAttribute(attr, valor)
      return () => el.setAttribute(attr, antes)
    }
    const volta = [
      trocar('link[rel=manifest]', 'href', '/admin.webmanifest'),
      trocar('link[rel=apple-touch-icon]', 'href', '/icons/admin-192.png'),
      trocar('meta[name=apple-mobile-web-app-title]', 'content', 'Admin OQVR'),
      trocar('meta[name=theme-color]', 'content', '#1a1630'),
    ]
    return () => volta.forEach((f) => f())
  }, [])
}

export default function AvisosAdmin({ uid }) {
  const [ligado, setLigado] = useState(() => ler(CHAVE) === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted')
  const [fechado, setFechado] = useState(() => ler(CHAVE + 'Fechado') === '1')
  const [podeInstalar, setPodeInstalar] = useState(podeInstalarDireto())
  const [estado, setEstado] = useState('')
  useEffect(() => {
    const f = () => setPodeInstalar(podeInstalarDireto())
    window.addEventListener('pode-instalar', f); return () => window.removeEventListener('pode-instalar', f)
  }, [])

  const ativar = async () => {
    setEstado('ativando')
    try {
      const { obterToken } = await import('../lib/lembrete')
      const token = await obterToken()
      await setDoc(doc(db, 'avisosAdmin', uid), { tokens: arrayUnion(token), em: serverTimestamp() }, { merge: true })
      gravar(CHAVE, '1'); setLigado(true); setEstado('')
    } catch (x) { setEstado(x.message || 'Não deu para ativar agora.') }
  }

  const ios = aparelhoIOS()
  // Só conta como "app do painel" quando abriu pelo ícone Admin OQVR (start_url com ?o=app-admin).
  // Aberto dentro do app da agenda, mostra como instalar o painel separado.
  try { if (location.search.includes('o=app-admin')) sessionStorage.setItem('appAdmin', '1') } catch {}
  const noAdmin = (() => { try { return sessionStorage.getItem('appAdmin') === '1' } catch { return false } })()
  const noAppAgenda = appInstalado() && !noAdmin
  const app = appInstalado() && noAdmin
  if (ligado && (app || fechado)) return null
  if (fechado && !podeInstalar) return null
  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <div className="relative flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
        <img src="/icons/admin-192.png" alt="" className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 pr-8 text-sm">
          <p className="font-bold">Painel no celular, com aviso de envio novo</p>
          <p className="text-muted">
            {noAppAgenda ? <>Você está no app da agenda. Para ter o painel separado, abra <b>oquevairolar.com.br/admin</b> no {ios ? 'Safari' : 'Chrome'} e toque em <b>Instalar painel</b>{ios ? ' (ou Compartilhar e Adicionar à Tela de Início)' : ' (ou no menu ⋮, Instalar app)'}.</>
              : app ? 'Ative os avisos para saber quando chegar evento pelo formulário ou pedido de página.'
              : ios ? <>Instale o painel como app: toque em <Share className="inline size-4" aria-label="Compartilhar" /> <b>Compartilhar</b> e em <b>Adicionar à Tela de Início</b>. No iPhone, os avisos só funcionam pelo app instalado.</>
              : 'Instale o painel como um app separado (ícone "Admin OQVR") e ative os avisos para saber quando chegar evento ou pedido.'}
          </p>
          {estado && estado !== 'ativando' && <p role="alert" className="mt-1 font-semibold text-danger">{estado}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!app && podeInstalar && <button onClick={async () => setPodeInstalar(!(await instalarDireto()) && podeInstalarDireto())} className="btn-ghost h-11 text-sm"><Download className="size-4" aria-hidden /> Instalar painel</button>}
          {!ligado && (!ios || app) && <button onClick={ativar} disabled={estado === 'ativando'} className="btn-brand h-11 text-sm"><BellRing className="size-4" aria-hidden /> {estado === 'ativando' ? 'Ativando…' : 'Ativar avisos'}</button>}
          {ligado && <span className="inline-flex h-11 items-center gap-1 text-sm font-semibold text-brand-ink"><Check className="size-4" aria-hidden /> Avisos ligados</span>}
        </div>
        <button onClick={() => { gravar(CHAVE + 'Fechado', '1'); setFechado(true) }} aria-label="Fechar" className="absolute right-1 top-1 grid size-11 place-items-center text-muted"><X className="size-4" /></button>
      </div>
    </div>
  )
}
