// Ranking do mês (estilo GymRats): pessoas contam rolês em que fizeram "Tô aqui" no local;
// bares somam os "Tô aqui" feitos neles. "Eu vou" sozinho não conta. A conta é feita pelo robô a cada 10 minutos.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from './firebase'
import { km } from './distancia'
import { clique } from './visitas'

export const mesAtual = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(d).slice(0, 7)
export const nomeMes = (m) => new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(new Date(m + '-15T12:00:00Z'))

export async function buscarRanking(mes = mesAtual()) {
  const s = await getDoc(doc(db, 'ranking', mes)).catch(() => null)
  return s?.exists() ? s.data() : { pessoas: [], bares: [] }
}

// "Tô aqui" só no horário (30 min antes do início até o fim; sem fim, 8 horas depois) e com o local no mapa.
export function janelaCheckin(e, agora = new Date()) {
  if (!e.lat || !e.lng) return false
  const ini = e.inicio.getTime() - 30 * 60000, fim = (e.fim || new Date(e.inicio.getTime() + 8 * 3600000)).getTime()
  return agora.getTime() >= ini && agora.getTime() <= fim
}

export async function jaFiz(eventoId) {
  const u = auth.currentUser; if (!u) return false
  const s = await getDoc(doc(db, 'checkins', `${eventoId}_${u.uid}`)).catch(() => null)
  return !!s?.exists()
}

const posicao = () => new Promise((ok, erro) => navigator.geolocation
  ? navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }), erro, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  : erro(new Error('sem gps')))

// Confere se a pessoa está a até 500 m do local e registra. Devolve null ou a mensagem de erro.
export async function fazerCheckin(e) {
  const u = auth.currentUser
  if (!u) return 'Entre com o Google para contar no ranking.'
  {
    let p
    try { p = await posicao() } catch { return 'Libere a localização para confirmar que você está no rolê.' }
    const d = km(p, e)
    if (d == null || d > 0.5) return `Você está a ${d < 10 ? d.toFixed(1).replace('.', ',') : Math.round(d)} km do local. O "Tô aqui" vale só lá no rolê.`
  }
  try {
    await setDoc(doc(db, 'checkins', `${e.id}_${u.uid}`), { eventoId: e.id, uid: u.uid, em: serverTimestamp() })
  } catch { return 'Não deu para registrar agora. Tente de novo em instantes.' }
  clique('to-aqui', e.id)
  return null
}
