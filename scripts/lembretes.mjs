// Envia os lembretes no celular de quem pediu. Roda junto com a publicação (a cada 10 minutos).
// Hora do lembrete: 3 horas antes do evento. Se cair de madrugada (antes das 8h), vai às 20h da véspera.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

initializeApp({ credential: applicationDefault(), projectId: 'oquevairolar-b0129' })
const db = getFirestore(), fcm = getMessaging()
const FUSO = -3 * 3600000 // Brasília
const SITE = 'https://oquevairolar.com.br'

const horaLocal = (d) => new Date(d.getTime() + FUSO).getUTCHours()
function quandoAvisar(inicio) {
  let t = new Date(inicio.getTime() - 3 * 3600000)
  const h = horaLocal(t)
  if (h < 8) { const l = new Date(t.getTime() + FUSO); l.setUTCDate(l.getUTCDate() - 1); l.setUTCHours(20, 0, 0, 0); t = new Date(l.getTime() - FUSO) }
  else if (h >= 23) { const l = new Date(t.getTime() + FUSO); l.setUTCHours(20, 0, 0, 0); t = new Date(l.getTime() - FUSO) }
  return t
}
const hhmm = (d) => new Date(d.getTime() + FUSO).toISOString().slice(11, 16)
const mesmoDia = (a, b) => new Date(a.getTime() + FUSO).toISOString().slice(0, 10) === new Date(b.getTime() + FUSO).toISOString().slice(0, 10)
const miniatura = (u) => (u && u.includes('res.cloudinary.com') ? u.replace(/\/upload\/(f_auto,q_auto,w_\d+\/)?/, '/upload/f_jpg,q_auto,w_720/') : undefined)

const agora = new Date()
const snap = await db.collection('eventos')
  .where('inicio', '>=', Timestamp.fromDate(new Date(agora.getTime() - 3600000)))
  .where('inicio', '<=', Timestamp.fromDate(new Date(agora.getTime() + 30 * 3600000))).get()

let enviados = 0, falhas = 0
for (const d of snap.docs) {
  const e = { id: d.id, ...d.data() }; e.inicio = e.inicio.toDate()
  if (e.status !== 'publicado') continue
  if (quandoAvisar(e.inicio) > agora) continue
  const pedidos = await db.collection('lembretes').where('eventoId', '==', e.id).get()
  for (const p of pedidos.docs) {
    const { token } = p.data()
    const dia = mesmoDia(e.inicio, agora) ? 'Hoje' : 'Amanhã'
    try {
      await fcm.send({
        token,
        webpush: {
          headers: { TTL: '10800', Urgency: 'high' },
          data: {
            titulo: `${dia} às ${hhmm(e.inicio)}: ${e.titulo}`,
            corpo: [e.localNome, e.cidade].filter(Boolean).join(' · ') + '. Bora?',
            url: `/evento/${e.id}?o=lembrete`,
            imagem: miniatura(e.cartazUrl) || '',
            tag: `lembrete-${e.id}`,
          },
          fcmOptions: { link: `${SITE}/evento/${e.id}?o=lembrete` },
        },
      })
      enviados++
    } catch (err) { falhas++; console.warn('lembrete falhou', p.id, err.code || err.message) }
    await p.ref.delete() // enviado ou endereço vencido: não manda de novo
  }
}

// Evento novo de quem a pessoa segue (bar, banda, produtora): avisa uma vez só.
const slug = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
let avisos = 0
const novos = await db.collection('eventos')
  .where('criadoEm', '>=', Timestamp.fromDate(new Date(agora.getTime() - 3 * 86400000))).get()
for (const d of novos.docs) {
  const e = { id: d.id, ...d.data() }
  if (e.status !== 'publicado' || e.avisoSeguidores || !e.inicio || e.inicio.toDate() < agora) continue
  e.inicio = e.inicio.toDate()
  const slugs = [...new Set([e.perfil, slug(e.localNome), ...(e.atracoes || []).map(slug), slug(e.instagram)].filter(Boolean))]
  const nomes = new Map(), uids = new Set()
  for (const s of slugs) {
    const seg = await db.collection('seguidores').where('slug', '==', s).get()
    seg.docs.forEach((x) => { const v = x.data(); uids.add(v.uid); if (!nomes.has(v.uid)) nomes.set(v.uid, v.nome) })
  }
  for (const uid of uids) {
    const ap = await db.doc(`aparelhos/${uid}`).get()
    const tokens = ap.exists ? ap.data().tokens || [] : []
    const vencidos = []
    for (const token of tokens) {
      try {
        await fcm.send({
          token,
          webpush: {
            headers: { TTL: '86400' },
            data: {
              titulo: `Novo evento: ${e.titulo}`,
              corpo: `${nomes.get(uid) || e.localNome || 'Quem você segue'} · ${new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' }).format(e.inicio)} às ${hhmm(e.inicio)}`,
              url: `/evento/${e.id}?o=seguindo`,
              imagem: miniatura(e.cartazUrl) || '',
              tag: `novo-${e.id}`,
            },
            fcmOptions: { link: `${SITE}/evento/${e.id}?o=seguindo` },
          },
        })
        avisos++
      } catch (err) {
        if (['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(err.code)) vencidos.push(token)
        else console.warn('aviso falhou', uid, err.code || err.message)
      }
    }
    if (vencidos.length) await ap.ref.update({ tokens: FieldValue.arrayRemove(...vencidos) })
  }
  await d.ref.update({ avisoSeguidores: true })
}

// Aviso no app do painel admin: evento novo pelo formulário e pedido de página de bar/banda. Avisa uma vez cada.
let avisosAdmin = 0
const pendentes = (await db.collection('eventos').where('status', '==', 'pendente').get()).docs.filter((d) => !d.data().avisoAdmin)
const pedidosNovos = (await db.collection('pedidos').where('status', '==', 'pendente').get()).docs.filter((d) => !d.data().avisoAdmin)
if (pendentes.length || pedidosNovos.length) {
  const partes = []
  if (pendentes.length) partes.push(pendentes.length === 1 ? `Evento novo: ${pendentes[0].data().titulo || 'sem título'}` : `${pendentes.length} eventos novos para aprovar`)
  if (pedidosNovos.length) partes.push(pedidosNovos.length === 1 ? `Pedido de página: ${pedidosNovos[0].data().nome}` : `${pedidosNovos.length} pedidos de página`)
  const url = pendentes.length ? '/admin/eventos?aba=pendente&o=aviso-admin' : '/admin/pedidos?o=aviso-admin'
  const aps = await db.collection('avisosAdmin').get()
  for (const ap of aps.docs) {
    const vencidos = []
    for (const token of ap.data().tokens || []) {
      try {
        await fcm.send({ token, webpush: {
          headers: { TTL: '86400', Urgency: 'high' },
          data: { titulo: partes[0], corpo: partes.slice(1).join(' · ') || 'Toque para revisar no painel.', url, tag: 'admin-pendentes' },
          fcmOptions: { link: SITE + url },
        } })
        avisosAdmin++
      } catch (err) {
        if (['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(err.code)) vencidos.push(token)
        else console.warn('aviso admin falhou', ap.id, err.code || err.message)
      }
    }
    if (vencidos.length) await ap.ref.update({ tokens: FieldValue.arrayRemove(...vencidos) })
  }
  await Promise.all([...pendentes, ...pedidosNovos].map((d) => d.ref.update({ avisoAdmin: true })))
}

// A contagem de "Eu vou", rostos e acessos de cada evento saiu daqui: fica em scripts/contagens.mjs.

// Ranking do mês: só conta "Tô aqui" (feito no local e no horário). Pessoas = rolês; bares = check-ins feitos neles.
// Cada bar também tem o seu ranking do mês (o 1º é o "Dono da mesa", como o prefeito do Foursquare).
// Fica tudo em ranking/{AAAA-MM}; ranking/locais guarda o ranking dos bares do mês atual.
// Nos 2 primeiros dias do mês o mês anterior é recalculado e marcado como fechado (resultado final).
const mesDe = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(d).slice(0, 7)
const evLocal = new Map(), perfis = new Map()
const perfil = async (uid) => { if (!perfis.has(uid)) { const u = await db.doc(`usuarios/${uid}`).get(); perfis.set(uid, u.exists && u.data().publico ? u.data() : null) } return perfis.get(uid) }
const pessoa = (uid, u, n) => ({ uid, nome: (u.nome || '').split(' ')[0], foto: u.foto || '', n })
async function rankingDoMes(mes) {
  const inicioMes = new Date(`${mes}-01T03:00:00Z`)
  const fimMes = new Date(inicioMes); fimMes.setUTCMonth(fimMes.getUTCMonth() + 1)
  const chk = await db.collection('checkins').where('em', '>=', Timestamp.fromDate(inicioMes)).where('em', '<', Timestamp.fromDate(fimMes)).get()
  const porPessoa = new Map(), porBar = new Map(), porLocal = {}
  for (const d of chk.docs) {
    const c = d.data()
    porPessoa.set(c.uid, (porPessoa.get(c.uid) || 0) + 1)
    if (!evLocal.has(c.eventoId)) { const ev = await db.doc(`eventos/${c.eventoId}`).get(); evLocal.set(c.eventoId, ev.exists && ev.data().localNome ? { slug: slug(ev.data().localNome), nome: ev.data().localNome } : null) }
    const l = evLocal.get(c.eventoId); if (!l) continue
    const b = porBar.get(l.slug) || { slug: l.slug, nome: l.nome, n: 0 }; b.n++; porBar.set(l.slug, b)
    porLocal[l.slug] = porLocal[l.slug] || {}; porLocal[l.slug][c.uid] = (porLocal[l.slug][c.uid] || 0) + 1
  }
  const pessoas = []
  for (const [uid, n] of [...porPessoa].sort((a, b) => b[1] - a[1]).slice(0, 60)) {
    const u = await perfil(uid); if (u) pessoas.push(pessoa(uid, u, n))
    if (pessoas.length >= 30) break
  }
  const locais = {}
  for (const [l, contas] of Object.entries(porLocal)) {
    const lista = []
    for (const [uid, n] of Object.entries(contas).sort((a, b) => b[1] - a[1])) {
      const u = await perfil(uid); if (u) lista.push(pessoa(uid, u, n))
      if (lista.length >= 10) break
    }
    if (lista.length) locais[l] = lista
  }
  const bares = [...porBar.values()].sort((a, b) => b.n - a.n).slice(0, 20)
  return { pessoas, bares, porLocal: locais }
}
const mes = mesDe(agora)
const atual = await rankingDoMes(mes)
await db.doc(`ranking/${mes}`).set({ ...atual, atualizadoEm: FieldValue.serverTimestamp() })
await db.doc('ranking/locais').set({ mes, porLocal: atual.porLocal, atualizadoEm: FieldValue.serverTimestamp() })
if (Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(agora)) <= 2) {
  const anterior = mesDe(new Date(new Date(`${mes}-01T03:00:00Z`).getTime() - 86400000))
  await db.doc(`ranking/${anterior}`).set({ ...(await rankingDoMes(anterior)), fechado: true, atualizadoEm: FieldValue.serverTimestamp() })
}

// Limpa pedidos antigos de eventos que já passaram (mais de 60 dias).
const velhos = await db.collection('lembretes').where('em', '<', Timestamp.fromDate(new Date(agora.getTime() - 60 * 86400000))).limit(200).get()
await Promise.all(velhos.docs.map((v) => v.ref.delete()))
console.log(`Lembretes: ${enviados} enviados, ${falhas} falharam, ${velhos.size} antigos apagados. Avisos de evento novo: ${avisos}. Avisos ao admin: ${avisosAdmin}.`)
