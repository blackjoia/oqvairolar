import {
  collection, doc, getDoc, getDocs, query, where, orderBy, setDoc, updateDoc,
  deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore/lite'
import { db } from './firebase'
import { toDate } from './datas'

const col = collection(db, 'eventos')

const normaliza = (snap) => {
  const d = snap.data()
  return { id: snap.id, ...d, inicio: toDate(d.inicio), fim: toDate(d.fim) }
}

// Público: só eventos publicados que ainda não acabaram.
const modoDemo = () => import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

// A agenda é lida uma vez e reaproveitada por 2 minutos: voltar do evento para a lista (ou abrir a semana,
// o local etc.) fica instantâneo e não lê os ~60 eventos do banco de novo a cada tela.
let memo = null // { em, promessa, lista }
export function listarPublicados({ fresco = false } = {}) {
  if (modoDemo()) return import('./demo').then((m) => m.DEMO)
  if (!fresco && memo && Date.now() - memo.em < 120000) return memo.promessa
  const ontem = new Date(); ontem.setHours(0, 0, 0, 0)
  const q = query(col, where('status', '==', 'publicado'), where('inicio', '>=', Timestamp.fromDate(ontem)), orderBy('inicio'))
  const atual = { em: Date.now(), lista: null }
  atual.promessa = getDocs(q).then((snap) => { atual.lista = snap.docs.map(normaliza); return atual.lista })
  atual.promessa.catch(() => { if (memo === atual) memo = null })
  memo = atual
  return atual.promessa
}
// A agenda que já está na memória (sem esperar nada), ou null.
export const agendaNaMemoria = () => memo?.lista || null

const datas = (x) => ({ ...x, inicio: new Date(x.inicio), fim: x.fim ? new Date(x.fim) : null })
// Primeira visita: cópia da agenda que o site gera de hora em hora (/agenda.json, já pedida pelo index.html
// enquanto o app carrega). Aparece na hora; a lista do banco chega logo depois e substitui.
export function agendaRapida() {
  const p = typeof window !== 'undefined' && window.__agenda
  if (!p || modoDemo()) return Promise.resolve(null)
  return p.then((j) => (Array.isArray(j?.eventos) ? j.eventos.map(datas) : null)).catch(() => null)
}
// Última agenda vista neste aparelho (até 1 dia), para a tela abrir já com eventos.
export function agendaDoAparelho(maxIdade = 86400000) {
  try {
    const em = Number(localStorage.getItem('agenda-cache-em') || 0)
    if (maxIdade && Date.now() - em > maxIdade) return null
    const l = JSON.parse(localStorage.getItem('agenda-cache') || 'null')
    return Array.isArray(l) && l.length ? l.map(datas) : null
  } catch { return null }
}
export function guardarAgenda(lista) {
  try { localStorage.setItem('agenda-cache', JSON.stringify(lista)); localStorage.setItem('agenda-cache-em', String(Date.now())) } catch {}
}

// Evento que já veio junto com a agenda (abrir pela lista não espera o banco).
export function eventoNaMemoria(id) {
  return agendaNaMemoria()?.find((e) => e.id === id) || null
}

export async function buscarEvento(id) {
  if (import.meta.env.DEV && id.endsWith('-demo')) return (await import('./demo')).DEMO.find((e) => e.id === id) || null
  const snap = await getDoc(doc(db, 'eventos', id))
  return snap.exists() ? normaliza(snap) : null
}

// Admin: tudo.
export async function listarTodos() {
  if (modoDemo()) return (await import('./demo')).DEMO
  const snap = await getDocs(query(col, orderBy('inicio', 'desc')))
  return snap.docs.map(normaliza)
}

export function slugify(t) {
  return String(t || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// O id do documento é o link fixo: /evento/<id>
export function gerarId(titulo, inicio) {
  const d = inicio ? inicio.toISOString().slice(0, 10) : ''
  const sufixo = Math.random().toString(36).slice(2, 6)
  return [slugify(titulo), d, sufixo].filter(Boolean).join('-')
}

const paraFirestore = (e) => ({
  ...e,
  inicio: e.inicio ? Timestamp.fromDate(e.inicio) : null,
  fim: e.fim ? Timestamp.fromDate(e.fim) : null,
})

export async function criarEvento(e) {
  const id = gerarId(e.titulo, e.inicio)
  const { id: _ignora, ...dados } = e
  await setDoc(doc(db, 'eventos', id), {
    ...paraFirestore(dados),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return id
}

export async function salvarEvento(id, e) {
  const { id: _ignora, criadoEm: _c, ...dados } = e
  await updateDoc(doc(db, 'eventos', id), { ...paraFirestore(dados), atualizadoEm: serverTimestamp() })
}

export const mudarStatus = (id, status) =>
  updateDoc(doc(db, 'eventos', id), { status, atualizadoEm: serverTimestamp() })

export const apagarEvento = (id) => deleteDoc(doc(db, 'eventos', id))

// Busca coordenadas do endereço no OpenStreetMap (grátis, sem chave).
export async function geocodificar(endereco, cidade) {
  const q = [endereco, cidade, 'PR', 'Brasil'].filter(Boolean).join(', ')
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`)
  const j = await r.json()
  if (!j[0]) return null
  return { lat: Number(j[0].lat), lng: Number(j[0].lon) }
}

// Formulário público: o evento entra como "pendente" e só aparece depois da aprovação.
const CAMPOS_PUBLICOS = ['titulo', 'categoria', 'generos', 'inicio', 'fim', 'localNome', 'endereco', 'cidade',
  'lat', 'lng', 'descricao', 'cartazUrl', 'ingressoUrl', 'gratuito', 'preco', 'instagram', 'enviadoPor']

export async function enviarParaAprovacao(e) {
  const dados = Object.fromEntries(CAMPOS_PUBLICOS.map((k) => [k, e[k] ?? null]))
  const id = gerarId(e.titulo, e.inicio)
  await setDoc(doc(db, 'eventos', id), {
    ...paraFirestore(dados),
    status: 'pendente',
    origem: 'formulario',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return id
}

// Página oficial: o dono publica direto, sem aprovação (as regras conferem se ele é dono).
export async function publicarComoPerfil(e, perfil, uid) {
  const dados = Object.fromEntries(CAMPOS_PUBLICOS.filter((k) => k !== 'enviadoPor').map((k) => [k, e[k] ?? null]))
  const id = gerarId(e.titulo, e.inicio)
  await setDoc(doc(db, 'eventos', id), {
    ...paraFirestore(dados),
    perfil, criadoPor: uid,
    status: 'publicado',
    origem: 'perfil',
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  })
  return id
}
