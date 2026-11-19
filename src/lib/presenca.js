// "Eu vou" e "Tenho interesse": sem conta, um registro por aparelho e evento.
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getCountFromServer, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { clique } from './visitas'

function visitante() {
  try { let v = localStorage.getItem('vid'); if (!v) { v = Math.random().toString(36).slice(2, 12); localStorage.setItem('vid', v) } return v } catch { return null }
}
const ref = (eventoId) => { const v = visitante(); return v ? doc(db, 'presencas', `${eventoId}_${v}`) : null }

export async function minhaPresenca(eventoId) {
  const r = ref(eventoId); if (!r) return null
  try { const s = await getDoc(r); return s.exists() ? s.data().tipo : null } catch { return null }
}

export async function contarPresencas(eventoId) {
  const c = (tipo) => getCountFromServer(query(collection(db, 'presencas'), where('eventoId', '==', eventoId), where('tipo', '==', tipo)))
    .then((s) => s.data().count).catch(() => 0)
  const [vou, interesse] = await Promise.all([c('vou'), c('interesse')])
  return { vou, interesse }
}

// tipo: 'vou' | 'interesse' | null (desmarcar)
export async function marcarPresenca(eventoId, tipo) {
  const r = ref(eventoId); if (!r) return
  if (!tipo) return deleteDoc(r)
  clique(tipo === 'vou' ? 'eu-vou' : 'interesse', eventoId)
  return setDoc(r, { eventoId, visitante: visitante(), tipo, em: serverTimestamp() })
}
