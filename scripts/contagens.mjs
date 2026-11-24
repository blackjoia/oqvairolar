// Números que aparecem nos cards da agenda. Roda a cada 10 minutos (publicar) e na versão de teste.
// Para cada evento publicado das próximas 2 semanas grava:
//   vao        quantas pessoas marcaram "Eu vou"
//   vao24      quantas marcaram nas últimas 24 horas (selo "Bombando")
//   acessos7   quantas pessoas diferentes abriram o evento nos últimos 7 dias ("Em alta na semana")
//   acessos24  o mesmo nas últimas 24 horas
//   rostos     até 4 pessoas com perfil público que vão (nome e foto), para os rostos no card
// Tudo isso já é público hoje (presenças e perfis públicos têm leitura aberta); aqui só fica junto no evento.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

initializeApp({ credential: applicationDefault(), projectId: 'oquevairolar-b0129' })
const db = getFirestore()
const agora = Date.now()
const H = 3600000

// Acessos: uma leitura só das visitas da semana, agrupadas por evento (pessoas diferentes, não recarregamentos)
const vis = await db.collection('visitas').where('em', '>=', Timestamp.fromMillis(agora - 7 * 24 * H)).get()
const acessos = new Map() // eventoId -> { semana:Set, dia:Set }
for (const d of vis.docs) {
  const v = d.data()
  if (v.tipo !== 'pagina' || !v.eventoId) continue
  const a = acessos.get(v.eventoId) || { semana: new Set(), dia: new Set() }
  a.semana.add(v.visitante)
  if (v.em && v.em.toMillis() >= agora - 24 * H) a.dia.add(v.visitante)
  acessos.set(v.eventoId, a)
}

const perfis = new Map()
async function perfil(uid) {
  if (!perfis.has(uid)) {
    const u = await db.doc(`usuarios/${uid}`).get()
    perfis.set(uid, u.exists && u.data().publico ? u.data() : null)
  }
  return perfis.get(uid)
}

const proximos = await db.collection('eventos')
  .where('inicio', '>=', Timestamp.fromMillis(agora - 6 * H))
  .where('inicio', '<=', Timestamp.fromMillis(agora + 14 * 24 * H)).get()

let mudados = 0
for (const d of proximos.docs) {
  const e = d.data()
  if (e.status !== 'publicado') continue
  const pres = await db.collection('presencas').where('eventoId', '==', d.id).get()
  const vou = pres.docs.map((p) => p.data()).filter((p) => p.tipo === 'vou')
    .sort((a, b) => (b.em?.toMillis?.() || 0) - (a.em?.toMillis?.() || 0))
  const rostos = []
  for (const p of vou) {
    if (rostos.length >= 4) break
    if (!p.uid || !p.perfil) continue
    const u = await perfil(p.uid)
    if (u) rostos.push({ uid: p.uid, nome: (u.nome || '').split(' ')[0].slice(0, 20), foto: (u.foto || '').slice(0, 500) })
  }
  const a = acessos.get(d.id)
  const novo = {
    vao: vou.length,
    vao24: vou.filter((p) => (p.em?.toMillis?.() || 0) >= agora - 24 * H).length,
    acessos7: a ? a.semana.size : 0,
    acessos24: a ? a.dia.size : 0,
    rostos,
  }
  const velho = { vao: e.vao || 0, vao24: e.vao24 || 0, acessos7: e.acessos7 || 0, acessos24: e.acessos24 || 0, rostos: e.rostos || [] }
  if (JSON.stringify(novo) !== JSON.stringify(velho)) { await d.ref.update(novo); mudados++ }
}
console.log(`Contagens: ${mudados} eventos atualizados de ${proximos.size}; ${vis.size} visitas lidas.`)
