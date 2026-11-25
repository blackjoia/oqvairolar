// Números que aparecem nos cards da agenda. Roda a cada 10 minutos (publicar) e na versão de teste.
// Para cada evento publicado das próximas 2 semanas grava:
//   vao        quantas pessoas marcaram "Eu vou"
//   vao24      quantas marcaram nas últimas 24 horas (selo "Bombando")
//   acessos7   quantas pessoas diferentes abriram o evento nos últimos 7 dias ("Em alta na semana")
//   acessos24  o mesmo nas últimas 24 horas
//   interesse  quantas marcaram "Tenho interesse"
//   rostos     sempre vazio: rosto e nome em "quem vai" são só de amigos (o site busca os amigos de cada um)
// As marcações de cada pessoa são privadas (só ela e os amigos leem); no evento ficam só os números.
// Também monta sugestoes/{uid} ("Talvez você conheça"): quem marcou Eu vou nos mesmos rolês, com perfil aberto.
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
  const interesse = pres.docs.filter((p) => p.data().tipo === 'interesse').length
  const a = acessos.get(d.id)
  const novo = {
    vao: vou.length,
    vao24: vou.filter((p) => (p.em?.toMillis?.() || 0) >= agora - 24 * H).length,
    acessos7: a ? a.semana.size : 0,
    acessos24: a ? a.dia.size : 0,
    interesse,
    rostos,
  }
  const velho = { vao: e.vao || 0, vao24: e.vao24 || 0, acessos7: e.acessos7 || 0, acessos24: e.acessos24 || 0, interesse: e.interesse || 0, rostos: e.rostos || [] }
  if (JSON.stringify(novo) !== JSON.stringify(velho)) { await d.ref.update(novo); mudados++ }
}
console.log(`Contagens: ${mudados} eventos atualizados de ${proximos.size}; ${vis.size} visitas lidas.`)

// ---------- sugestões de amigos ----------
const todasVou = await db.collection('presencas').where('tipo', '==', 'vou').get()
const porEvento = new Map() // eventoId -> [{ uid, perfil }]
for (const d of todasVou.docs) {
  const p = d.data()
  if (!p.uid) continue
  if (!porEvento.has(p.eventoId)) porEvento.set(p.eventoId, [])
  porEvento.get(p.eventoId).push({ uid: p.uid, perfil: !!p.perfil })
}
const ligados = new Map() // uid -> Set de uids com amizade ou pedido
for (const d of (await db.collection('amizades').get()).docs) {
  const [a, b] = d.data().uids || []
  if (!a || !b) continue
  if (!ligados.has(a)) ligados.set(a, new Set()); if (!ligados.has(b)) ligados.set(b, new Set())
  ligados.get(a).add(b); ligados.get(b).add(a)
}
const comum = new Map() // uid -> Map(outro -> rolês em comum)
for (const lista of porEvento.values()) {
  for (const eu of lista) for (const o of lista) {
    if (eu.uid === o.uid || !o.perfil) continue
    if (!comum.has(eu.uid)) comum.set(eu.uid, new Map())
    const m = comum.get(eu.uid); m.set(o.uid, (m.get(o.uid) || 0) + 1)
  }
}
let sugeridos = 0
for (const [uid, m] of comum) {
  const fora = ligados.get(uid) || new Set()
  const top = [...m].filter(([o]) => !fora.has(o)).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const lista = []
  for (const [o, n] of top) {
    if (lista.length >= 6) break
    const u = await perfil(o)
    if (u) lista.push({ uid: o, nome: (u.nome || '').slice(0, 60), foto: (u.foto || '').slice(0, 500), emComum: n })
  }
  const ref = db.doc(`sugestoes/${uid}`)
  const velho = (await ref.get()).data()?.lista || []
  if (JSON.stringify(velho) !== JSON.stringify(lista)) { await ref.set({ lista, em: Timestamp.now() }); sugeridos++ }
}
console.log(`Sugestões de amigos: ${sugeridos} contas atualizadas.`)
