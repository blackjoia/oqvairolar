// Tira nome e contato de quem enviou (enviadoPor, outrosEnvios) dos eventos já publicados
// e guarda em contatosEnvio/{id}, que só o admin lê. Evento publicado é aberto para todo mundo.
// Roda em toda publicação; quando não há nada para limpar, não grava nada.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oquevairolar-b0129' })
const db = getFirestore()
const snap = await db.collection('eventos').where('status', '==', 'publicado').get()
let n = 0
for (const d of snap.docs) {
  const { enviadoPor, outrosEnvios } = d.data()
  const envios = [...(enviadoPor ? [enviadoPor] : []), ...(Array.isArray(outrosEnvios) ? outrosEnvios : [])]
  if (enviadoPor === undefined && outrosEnvios === undefined) continue
  const lote = db.batch()
  if (envios.length) lote.set(db.collection('contatosEnvio').doc(d.id), { envios: FieldValue.arrayUnion(...envios), em: FieldValue.serverTimestamp() }, { merge: true })
  lote.update(d.ref, { enviadoPor: FieldValue.delete(), outrosEnvios: FieldValue.delete() })
  await lote.commit()
  n++
}
console.log(`${n} evento(s) publicado(s) sem o contato de quem enviou`)
