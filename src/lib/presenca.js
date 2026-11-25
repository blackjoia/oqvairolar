// "Eu vou" e "Tenho interesse": sem conta, um registro por aparelho e evento.
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { useEffect, useSyncExternalStore } from 'react'
import { db, auth } from './firebase'
import { clique } from './visitas'

function visitante() {
  try { let v = localStorage.getItem('vid'); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('vid', v) } return v } catch { return null }
}
// Com conta Google, a marcação fica na conta (vale em qualquer aparelho); sem conta, fica no aparelho.
const contaGoogle = () => { const u = auth.currentUser; return u && u.providerData.some((p) => p.providerId === 'google.com') ? u : null }
const quem = () => contaGoogle()?.uid || visitante()
const ref = (eventoId) => { const v = quem(); return v ? doc(db, 'presencas', `${eventoId}_${v}`) : null }

export async function minhaPresenca(eventoId) {
  const r = ref(eventoId); if (!r) return null
  try { const s = await getDoc(r); return s.exists() ? s.data().tipo : null } catch { return null }
}

// Os números vêm do robô (scripts/contagens.mjs), gravados no evento: as marcações de cada pessoa são privadas.
export function contarPresencas(evento) {
  return { vou: evento?.vao || 0, interesse: evento?.interesse || 0 }
}

// tipo: 'vou' | 'interesse' | null (desmarcar). publico: a pessoa aparece em "quem vai".
export async function marcarPresenca(eventoId, tipo, publico = true) {
  const r = ref(eventoId); if (!r) return
  if (!tipo) return deleteDoc(r)
  clique(tipo === 'vou' ? 'eu-vou' : 'interesse', eventoId)
  const u = contaGoogle()
  return setDoc(r, u
    ? { eventoId, visitante: u.uid, uid: u.uid, perfil: !!publico, tipo, em: serverTimestamp() }
    : { eventoId, visitante: visitante(), tipo, em: serverTimestamp() })
}

// ---------- "Eu vou" direto na lista ----------
// Carrega uma vez todas as marcações deste aparelho/conta e mantém um mapa eventoId -> tipo para os cards.
let mapa = new Map(), carregadoPara = null
const ajuste = new Map() // mudanças feitas nesta visita, para somar ao número do robô
const ouvintes = new Set()
const avisar = () => ouvintes.forEach((f) => f())
async function carregarMinhas() {
  const v = quem(); if (!v || carregadoPara === v) return
  carregadoPara = v
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) return
  try {
    // Com conta, busca pelo uid (as regras só liberam as marcações da própria conta e dos amigos).
    const s = await getDocs(query(collection(db, 'presencas'), contaGoogle() ? where('uid', '==', v) : where('visitante', '==', v)))
    mapa = new Map(s.docs.map((d) => [d.data().eventoId, d.data().tipo])); avisar()
  } catch { carregadoPara = null }
}
export function useMinhaPresencaNaLista(eventoId, uid) {
  useEffect(() => { carregarMinhas() }, [uid])
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f) }, () => mapa.get(eventoId) || null)
}
export const ajusteVao = (eventoId) => ajuste.get(eventoId) || 0
export async function alternarEuVou(eventoId) {
  const antes = mapa.get(eventoId) || null
  const novo = antes === 'vou' ? null : 'vou'
  ajuste.set(eventoId, (ajuste.get(eventoId) || 0) + (novo === 'vou' ? 1 : antes === 'vou' ? -1 : 0))
  mapa = new Map(mapa); if (novo) mapa.set(eventoId, novo); else mapa.delete(eventoId); avisar()
  if (import.meta.env.DEV && eventoId.endsWith('-demo')) return { antes, novo }
  try { await marcarPresenca(eventoId, novo) } catch { mapa = new Map(mapa); if (antes) mapa.set(eventoId, antes); else mapa.delete(eventoId); avisar() }
  return { antes, novo }
}
