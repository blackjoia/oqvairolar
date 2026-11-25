// Amigos entre contas do Google. Coleção amizades/{uidA_uidB} (uids em ordem):
// { uids: [a, b], de, para, status: 'pendente' | 'aceita', em, aceitaEm }.
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit, orderBy, startAt, endAt,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { clique } from './visitas'
import { buscarUsuario, normalizar } from './social'

export const idAmizade = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`)
export const outro = (a, eu) => a.uids.find((u) => u !== eu)

// Todas as amizades e pedidos da pessoa, separados.
export async function minhasAmizades(uid) {
  const snap = await getDocs(query(collection(db, 'amizades'), where('uids', 'array-contains', uid)))
  const todas = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return {
    amigos: todas.filter((a) => a.status === 'aceita').map((a) => outro(a, uid)),
    recebidos: todas.filter((a) => a.status === 'pendente' && a.para === uid).map((a) => a.de),
    enviados: todas.filter((a) => a.status === 'pendente' && a.de === uid).map((a) => a.para),
  }
}

// Situação com uma pessoa: null, 'enviado', 'recebido' ou 'amigos'.
export async function situacaoCom(eu, uid) {
  const s = await getDoc(doc(db, 'amizades', idAmizade(eu, uid))).catch(() => null)
  if (!s?.exists()) return null
  const a = s.data()
  if (a.status === 'aceita') return 'amigos'
  return a.de === eu ? 'enviado' : 'recebido'
}

export async function pedirAmizade(eu, uid) {
  const uids = [eu, uid].sort()
  await setDoc(doc(db, 'amizades', uids.join('_')), { uids, de: eu, para: uid, status: 'pendente', em: serverTimestamp() })
  clique('pedir-amizade')
}
export async function aceitarAmizade(eu, uid) {
  await updateDoc(doc(db, 'amizades', idAmizade(eu, uid)), { status: 'aceita', aceitaEm: serverTimestamp() })
  clique('aceitar-amizade')
}
// Recusar, cancelar o pedido ou desfazer a amizade.
export const desfazerAmizade = (eu, uid) => deleteDoc(doc(db, 'amizades', idAmizade(eu, uid)))

export async function perfisDe(uids) {
  const us = await Promise.all(uids.map(buscarUsuario))
  return us.filter(Boolean)
}

// Busca por começo do nome entre quem tem perfil aberto.
export async function buscarPessoas(texto, eu) {
  const t = normalizar(texto)
  if (t.length < 2) return []
  const snap = await getDocs(query(collection(db, 'usuarios'), where('publico', '==', true), orderBy('busca'), startAt(t), endAt(t + ''), limit(12)))
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => u.uid !== eu)
}

// Eventos que os amigos marcaram "Eu vou": { eventoId: [uid, ...] }.
export async function eventosDosAmigos(amigos) {
  const mapa = {}
  for (let i = 0; i < amigos.length; i += 30) {
    const snap = await getDocs(query(collection(db, 'presencas'), where('uid', 'in', amigos.slice(i, i + 30)), where('tipo', '==', 'vou'))).catch(() => null)
    snap?.docs.forEach((d) => { const p = d.data(); (mapa[p.eventoId] ||= []).push(p.uid) })
  }
  return mapa
}

// ---------- "Bora?": convidar amigos para um evento ----------
const idConvite = (eventoId, de, para) => `${eventoId}_${de}_${para}`
export async function convidar(eventoId, eu, amigos) {
  await Promise.all(amigos.map((uid) => setDoc(doc(db, 'convites', idConvite(eventoId, eu, uid)), { eventoId, de: eu, para: uid, visto: false, em: serverTimestamp() })))
  clique('bora', eventoId)
}
// Quem eu já chamei para este evento.
export async function jaConvidei(eventoId, eu) {
  const snap = await getDocs(query(collection(db, 'convites'), where('de', '==', eu), where('eventoId', '==', eventoId))).catch(() => null)
  return (snap?.docs || []).map((d) => d.data().para)
}
// Convites que recebi: [{ eventoId, de, visto, id }]
export async function convitesRecebidos(eu) {
  const snap = await getDocs(query(collection(db, 'convites'), where('para', '==', eu)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export const marcarConviteVisto = (id) => updateDoc(doc(db, 'convites', id), { visto: true })
export const apagarConvite = (id) => deleteDoc(doc(db, 'convites', id))

// ---------- sugestões: quem marcou Eu vou nos mesmos rolês (montado pelo robô em sugestoes/{uid}) ----------
export async function sugestoes(eu, excluir = []) {
  const s = await getDoc(doc(db, 'sugestoes', eu)).catch(() => null)
  const fora = new Set(excluir)
  return (s?.exists() ? s.data().lista || [] : []).filter((u) => !fora.has(u.uid))
}
