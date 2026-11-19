// Cadastra os eventos dos arquivos em eventos-novos/*.json (roda na publicação).
// Cada evento entra uma vez só (marca em importados/{id}): editar ou apagar no painel fica valendo.
// Para corrigir um evento já importado, aumente o "rev" dele no arquivo: os campos do arquivo são gravados por cima.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { readdirSync, readFileSync } from 'node:fs'

initializeApp({ credential: applicationDefault(), projectId: 'oquevairolar-b0129' })
const db = getFirestore()
const pasta = new URL('../eventos-novos/', import.meta.url)
let novos = 0
for (const arq of readdirSync(pasta).filter((f) => f.endsWith('.json'))) {
  const { comum = {}, eventos = [] } = JSON.parse(readFileSync(new URL(arq, pasta), 'utf8'))
  for (const { id, ...e } of eventos) {
    const ref = db.collection('eventos').doc(id), marca = db.collection('importados').doc(id)
    const { rev = 1, ...resto } = e
    const m = await marca.get()
    if (m.exists && (m.data().rev || 1) >= rev) continue
    if (m.exists && !(await ref.get()).exists) continue // apagado no painel: não volta
    const d = { ...comum, ...resto }
    await ref.set({ ...d, inicio: Timestamp.fromDate(new Date(d.inicio)), fim: d.fim ? Timestamp.fromDate(new Date(d.fim)) : null, ...(m.exists ? {} : { criadoEm: FieldValue.serverTimestamp() }), atualizadoEm: FieldValue.serverTimestamp() }, { merge: true })
    await marca.set({ em: FieldValue.serverTimestamp(), arquivo: arq, rev })
    novos++; console.log(m.exists ? 'atualizado:' : 'novo:', id)
  }
}
console.log(`${novos} evento(s) novo(s)`)
