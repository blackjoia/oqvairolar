// Envia os lembretes no celular de quem pediu. Roda junto com a publicação (a cada 10 minutos).
// Hora do lembrete: 3 horas antes do evento. Se cair de madrugada (antes das 8h), vai às 20h da véspera.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
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

// Limpa pedidos antigos de eventos que já passaram (mais de 60 dias).
const velhos = await db.collection('lembretes').where('em', '<', Timestamp.fromDate(new Date(agora.getTime() - 60 * 86400000))).limit(200).get()
await Promise.all(velhos.docs.map((v) => v.ref.delete()))
console.log(`Lembretes: ${enviados} enviados, ${falhas} falharam, ${velhos.size} antigos apagados.`)
