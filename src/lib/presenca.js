// "Eu vou" e "Tenho interesse": sem conta, um registro por aparelho e evento.
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
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
