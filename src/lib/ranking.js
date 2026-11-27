// Ranking do mês (estilo GymRats): pessoas contam rolês em que fizeram "Tô aqui" no local;
// bares somam os "Tô aqui" feitos neles. "Eu vou" sozinho não conta. A conta é feita pelo robô a cada 10 minutos.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite'
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

// Dados fictícios para mostrar como fica (abra /ranking?demo). Bares reais de Beltrão, números inventados.
const pessoa = (nome, n, i) => ({ uid: 'demo' + i, nome, n, foto: '' })
export const DEMO = {
  pessoas: [['Ana P.', 9], ['Rafa M.', 8], ['Luis', 7], ['Bruna K.', 6], ['Diego S.', 5], ['Carol T.', 5], ['Jean F.', 4], ['Mari L.', 3], ['Tiago R.', 2], ['Gabi C.', 1]].map(([n, x], i) => pessoa(n, x, i)),
  bares: [['Formosa Pub', 'formosa-pub', 38], ['Bar do Plets', 'plets', 33], ['Boteco Choppbel', 'boteco-choppbel', 21], ['Hangar 80', 'hangar-80', 16], ['Alles', 'alles', 9], ["Neco's Boteco", 'necos-boteco', 4]].map(([nome, slug, n]) => ({ nome, slug, n })),
}

// Ranking de um bar: quem mais fez "Tô aqui" nele no mês atual (o 1º é o "dono da mesa").
export async function rankingDoLocal(slug) {
  if (new URLSearchParams(location.search).has('demo')) return DEMO.pessoas.slice(0, 6).map((p, i) => ({ ...p, n: [7, 5, 4, 3, 2, 1][i] }))
  const s = await getDoc(doc(db, 'ranking', 'locais')).catch(() => null)
  return (s?.exists() && s.data().mes !== undefined && s.data().mes !== mesAtual() ? [] : s?.exists() && s.data().porLocal?.[slug]) || []
}
