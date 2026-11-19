import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BellRing, X } from 'lucide-react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { clique } from '../lib/visitas'

// No app instalado: pergunta uma vez se a pessoa quer receber avisos (agenda nova, novidades).
// Guarda só o endereço de notificação do aparelho em "inscritos" (sem nome nem e-mail).
const CHAVE = 'avisosPerguntadoEm'
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const ler = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const gravar = (k, v) => { try { localStorage.setItem(k, v) } catch {} }
function visitante() {
  try { let v = localStorage.getItem('vid'); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('vid', v) } return v } catch { return null }
}

export async function inscreverAvisos() {
  const { obterToken } = await import('../lib/lembrete')
  const token = await obterToken()
  const v = visitante(); if (!v) throw new Error('Não deu para ativar neste aparelho.')
  await setDoc(doc(db, 'inscritos', v), { token, em: serverTimestamp() })
  gravar('avisosAtivos', '1')
  clique('avisos-ativados')
}

export default function PedirAvisos() {
  const { pathname } = useLocation()
  const [aberto, setAberto] = useState(false)
  const [estado, setEstado] = useState('')

  useEffect(() => {
    if (!instalado() || pathname.startsWith('/admin') || !('Notification' in window)) return
    // Já deu permissão antes: só renova o cadastro em silêncio
    if (Notification.permission === 'granted') { if (ler('avisosAtivos') !== '1') inscreverAvisos().catch(() => {}); return }
    if (Notification.permission === 'denied') return
    const antes = Number(ler(CHAVE) || 0)
    if (Date.now() - antes < 7 * 86400000) return // perguntou há menos de 7 dias
    const t = setTimeout(() => setAberto(true), 4000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!aberto) return null
  const fechar = () => { gravar(CHAVE, String(Date.now())); setAberto(false) }
  const ativar = async () => {
    setEstado('ativando')
    try { await inscreverAvisos(); gravar(CHAVE, String(Date.now())); setAberto(false) }
    catch (x) { setEstado(x.message || 'Não deu para ativar agora.') }
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm" role="dialog" aria-label="Ativar avisos">
      <div className="relative flex gap-3 rounded-2xl border border-line bg-surface p-4 shadow-2xl">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white"><BellRing className="size-6" aria-hidden /></span>
        <div className="min-w-0 flex-1 pr-6 text-sm">
          <p className="font-display text-lg uppercase leading-tight">Quer saber o que vai rolar?</p>
          <p className="text-muted">Ative os avisos e receba quando sair a agenda nova e os destaques do fim de semana. Sem spam.</p>
          {estado && estado !== 'ativando' && <p role="alert" className="mt-1 font-semibold text-danger">{estado}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={ativar} disabled={estado === 'ativando'} className="btn-brand h-11 flex-1 text-sm">{estado === 'ativando' ? 'Ativando…' : 'Ativar avisos'}</button>
            <button onClick={fechar} className="btn-ghost h-11 text-sm">Agora não</button>
          </div>
        </div>
        <button onClick={fechar} aria-label="Fechar" className="absolute right-1 top-1 grid size-11 place-items-center text-muted"><X className="size-4" /></button>
      </div>
    </div>
  )
}
