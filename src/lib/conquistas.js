// Decide se mostra a comemoração do ranking quando a pessoa abre o app:
// 1) resultado do mês que fechou (uma vez por mês); 2) entrou ou subiu no pódio (1º, 2º ou 3º) no geral ou num bar.
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { mesAtual } from './ranking'

const ler = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const pegar = async (id) => { const s = await getDoc(doc(db, 'ranking', id)).catch(() => null); return s?.exists() ? s.data() : null }
const nomeBar = (r, slug) => r?.bares?.find((b) => b.slug === slug)?.nome || slug.replace(/-/g, ' ')

function podios(r, uid) {
  const m = {}
  const g = (r?.pessoas || []).findIndex((p) => p.uid === uid)
  if (g >= 0 && g < 3) m.geral = g
  for (const [slug, lista] of Object.entries(r?.porLocal || {})) {
    const i = lista.findIndex((p) => p.uid === uid)
    if (i >= 0 && i < 3) m[slug] = i
  }
  return m
}

export async function verConquista(uid) {
  const mes = mesAtual()
  const anterior = mesAtual(new Date(new Date(`${mes}-01T12:00:00Z`).getTime() - 86400000))

  // Resultado do mês que passou
  const kFechou = `oqvr-fechou-${anterior}`
  if (!ler(kFechou)) {
    const r = await pegar(anterior)
    if (r?.fechado) {
      gravar(kFechou, true)
      const pos = (r.pessoas || []).findIndex((p) => p.uid === uid)
      const bares = Object.entries(podios(r, uid)).filter(([k, v]) => k !== 'geral' && v === 0).map(([k]) => nomeBar(r, k))
      if (pos >= 0 || bares.length) return { tipo: 'fechou', mes: anterior, pos, n: r.pessoas[pos]?.n || 0, bares }
    }
  }

  // Subiu no pódio no mês atual
  const r = await pegar(mes); if (!r) return null
  const locais = await pegar('locais')
  if (locais?.mes === mes) r.porLocal = locais.porLocal
  const agora = podios(r, uid), kPodio = `oqvr-podio-${mes}`, antes = ler(kPodio) || {}
  gravar(kPodio, agora)
  const subiu = Object.entries(agora).filter(([k, v]) => antes[k] === undefined || v < antes[k]).sort((a, b) => a[1] - b[1] || (a[0] === 'geral' ? -1 : 1))[0]
  if (!subiu) return null
  const [onde, pos] = subiu
  return { tipo: 'podio', mes, pos, onde: onde === 'geral' ? null : nomeBar(r, onde), slug: onde === 'geral' ? null : onde }
}

// Para ver como fica: ?conquista=1, 2, 3 (pódio num bar), geral ou fechou
export function conquistaDemo(v) {
  if (v === 'fechou') return { tipo: 'fechou', mes: '2026-11', pos: 1, n: 8, bares: ['Formosa Pub'] }
  if (v === 'geral') return { tipo: 'podio', mes: mesAtual(), pos: 0, onde: null }
  const pos = Math.min(2, Math.max(0, Number(v) - 1 || 0))
  return { tipo: 'podio', mes: mesAtual(), pos, onde: 'Formosa Pub', slug: 'formosa-pub' }
}
