// Lembrete no celular (notificação push) algumas horas antes do evento.
// Guarda no Firestore só o evento, o aparelho e o endereço de entrega da notificação.
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore/lite'
import { db, app } from './firebase'
import { clique } from './visitas'

const VAPID = import.meta.env.VITE_VAPID_KEY
const chave = (id) => `lembrete_${id}`

function visitante() {
  try { let v = localStorage.getItem('vid'); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('vid', v) } return v } catch { return null }
}

export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

// 'ok' | 'ios-instalar' | 'nao-suporta'
export async function podeLembrar() {
  if (!VAPID || !('serviceWorker' in navigator) || !('Notification' in window)) return ehIOS() && !instalado() ? 'ios-instalar' : 'nao-suporta'
  const { isSupported } = await import('firebase/messaging')
  if (!(await isSupported().catch(() => false))) return ehIOS() && !instalado() ? 'ios-instalar' : 'nao-suporta'
  return 'ok'
}

export function temLembrete(id) { try { return localStorage.getItem(chave(id)) === '1' } catch { return false } }

// Pede permissão e devolve o endereço de notificação deste aparelho.
export async function obterToken() {
  if ((await podeLembrar()) !== 'ok') throw new Error(ehIOS() ? 'No iPhone, instale o app na tela de início para receber avisos.' : 'Este navegador não recebe notificações.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('As notificações estão bloqueadas. Libere nas permissões do navegador para receber o lembrete.')
  const { getMessaging, getToken } = await import('firebase/messaging')
  const reg = await navigator.serviceWorker.ready
  let token
  try { token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: reg }) }
  catch (x) {
    console.warn('lembrete', x)
    throw new Error(/permission/i.test(x?.code || x?.message || '') ? 'As notificações estão bloqueadas. Libere nas permissões do navegador para receber o lembrete.' : 'Não deu para ativar o lembrete agora. Tenta de novo daqui a pouco.')
  }
  if (!token) throw new Error('Não deu para ativar o lembrete agora.')
  return token
}

export async function ligarLembrete(id) {
  const token = await obterToken()
  const v = visitante()
  await setDoc(doc(db, 'lembretes', `${id}_${v}`), { eventoId: id, visitante: v, token, em: serverTimestamp() })
  try { localStorage.setItem(chave(id), '1') } catch {}
  clique('lembrete', id)
}

export async function desligarLembrete(id) {
  const v = visitante()
  try { localStorage.removeItem(chave(id)) } catch {}
  if (v) await deleteDoc(doc(db, 'lembretes', `${id}_${v}`)).catch(() => {})
}
