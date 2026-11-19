// Contador de visitas próprio (grava no Firestore, coleção "visitas").
// Não guarda nome, IP nem nada pessoal: só um código aleatório do aparelho.
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, getDocs, startAfter, Timestamp } from 'firebase/firestore'
import { db, auth, ehAdmin } from './firebase'

const aleatorio = () => Math.random().toString(36).slice(2, 12)
function guardado(store, chave) {
  try { let v = store.getItem(chave); if (!v) { v = aleatorio(); store.setItem(chave, v) } return v } catch { return 'sem' }
}

function desligado() {
  if (import.meta.env.DEV || navigator.webdriver) return true
  if (/bot|crawl|spider|preview|facebookexternalhit|whatsapp/i.test(navigator.userAgent)) return true
  const u = auth.currentUser
  if (ehAdmin(u)) return true // não conta o próprio admin
  try { if (localStorage.getItem('naoContar') === '1') return true } catch {}
  return false
}

function dispositivo() {
  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  return /Mobi|Android|iPhone/i.test(ua) ? 'celular' : 'computador'
}

// De onde a pessoa veio: ?o= nos links compartilhados, app do Instagram/Facebook ou site anterior.
function origem() {
  const p = new URLSearchParams(location.search)
  const o = p.get('o') || p.get('utm_source')
  if (o) return o.toLowerCase().slice(0, 40)
  const ua = navigator.userAgent
  if (/Instagram/i.test(ua)) return 'instagram'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook'
  try {
    const h = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''
    if (!h || h === location.hostname.replace(/^www\./, '')) return 'direto'
    if (/instagram/.test(h)) return 'instagram'
    if (/facebook|fb\./.test(h)) return 'facebook'
    if (/whatsapp|wa\.me/.test(h)) return 'whatsapp'
    if (/google\./.test(h)) return 'google'
    return h.slice(0, 40)
  } catch { return 'direto' }
}

let origemSessao = null
// "nova" = primeiro acesso deste aparelho nas últimas 24 horas (recarregar a página não conta de novo)
function acessoNovo() {
  try {
    const ult = Number(localStorage.getItem('ultimoAcesso') || 0)
    if (Date.now() - ult < 86400000) return false
    localStorage.setItem('ultimoAcesso', String(Date.now()))
    return true
  } catch { return false }
}
function dadosBase(tipo) {
  const nova = tipo === 'pagina' ? acessoNovo() : false
  const sessao = guardado(sessionStorage, 'sid')
  if (!origemSessao) {
    try { origemSessao = sessionStorage.getItem('origem') } catch {}
    if (!origemSessao) { origemSessao = origem(); try { sessionStorage.setItem('origem', origemSessao) } catch {} }
  }
  return { visitante: guardado(localStorage, 'vid'), sessao, nova, origem: origemSessao, disp: dispositivo() }
}

// tipo: 'pagina' | 'clique' | 'filtro'
export function registrar(tipo, extra = {}) {
  if (desligado()) return
  const d = {
    tipo, ...dadosBase(tipo),
    pagina: location.pathname.slice(0, 200),
    eventoId: extra.eventoId ? String(extra.eventoId).slice(0, 120) : null,
    acao: extra.acao ? String(extra.acao).slice(0, 30) : null,
    valor: extra.valor ? String(extra.valor).slice(0, 60) : null,
    em: serverTimestamp(),
  }
  addDoc(collection(db, 'visitas'), d).catch(() => {})
}

export const clique = (acao, eventoId) => registrar('clique', { acao, eventoId })
export const filtro = (acao, valor) => registrar('filtro', { acao, valor })

// Painel do admin: lê as visitas dos últimos N dias.
// Estatísticas zeradas a pedido do Luis: só conta a partir de 19/11/2026 15h20 (Brasília).
export const CONTAR_DESDE = new Date('2026-11-19T15:20:00-03:00')
export async function listarVisitas(dias) {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) return (await import('./demo')).visitasDemo(dias)
  const desde = Timestamp.fromDate(new Date(Math.max(Date.now() - dias * 86400000, CONTAR_DESDE.getTime())))
  // O Firestore entrega no máximo 10 mil por vez: busca em páginas (até 60 mil)
  const todos = []; let ultimo = null
  for (let i = 0; i < 6; i++) {
    const partes = [collection(db, 'visitas'), where('em', '>=', desde), orderBy('em', 'asc'), limit(10000)]
    if (ultimo) partes.push(startAfter(ultimo))
    const s = await getDocs(query(...partes))
    s.docs.forEach((x) => { const v = x.data(); todos.push({ ...v, em: v.em?.toDate?.() || new Date() }) })
    if (s.docs.length < 10000) break
    ultimo = s.docs[s.docs.length - 1]
  }
  return todos
}
