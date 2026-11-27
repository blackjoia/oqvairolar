import {
  collection, doc, getDoc, getDocs, query, where, orderBy, setDoc, updateDoc,
  deleteDoc, serverTimestamp, Timestamp, deleteField, arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'
import { toDate } from './datas'

const col = collection(db, 'eventos')

const normaliza = (snap) => {
  const d = snap.data()
  return { id: snap.id, ...d, inicio: toDate(d.inicio), fim: toDate(d.fim) }
}

// Público: só eventos publicados que ainda não acabaram.
const modoDemo = () => import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

export async function listarPublicados() {
  if (modoDemo()) return (await import('./demo')).DEMO
  const ontem = new Date(); ontem.setHours(0, 0, 0, 0)
  const q = query(col, where('status', '==', 'publicado'), where('inicio', '>=', Timestamp.fromDate(ontem)), orderBy('inicio'))
  const snap = await getDocs(q)
  return snap.docs.map(normaliza)
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

// Nome e contato de quem mandou pelo formulário não podem ficar no evento publicado
// (o evento publicado é aberto para todo mundo ler). Na publicação eles vão para
// contatosEnvio/{id}, que só o admin lê.
async function guardarContatos(id, enviadoPor, outrosEnvios) {
  const envios = [...(enviadoPor ? [enviadoPor] : []), ...(outrosEnvios || [])]
  if (!envios.length) return
  await setDoc(doc(db, 'contatosEnvio', id), { envios: arrayUnion(...envios), em: serverTimestamp() }, { merge: true })
}
const semContatos = { enviadoPor: deleteField(), outrosEnvios: deleteField() }

export async function buscarContatos(id) {
  const s = await getDoc(doc(db, 'contatosEnvio', id)).catch(() => null)
  return s?.exists() ? s.data().envios || [] : []
}

export async function salvarEvento(id, e) {
  const { id: _ignora, criadoEm: _c, ...dados } = e
  if (dados.status === 'publicado' && (dados.enviadoPor || dados.outrosEnvios?.length)) {
    await guardarContatos(id, dados.enviadoPor, dados.outrosEnvios)
    delete dados.enviadoPor; delete dados.outrosEnvios
    await updateDoc(doc(db, 'eventos', id), { ...paraFirestore(dados), ...semContatos, atualizadoEm: serverTimestamp() })
    return
  }
  await updateDoc(doc(db, 'eventos', id), { ...paraFirestore(dados), atualizadoEm: serverTimestamp() })
}

export async function mudarStatus(id, status) {
  if (status === 'publicado') {
    const s = await getDoc(doc(db, 'eventos', id))
    const d = s.exists() ? s.data() : {}
    if (d.enviadoPor || d.outrosEnvios?.length) {
      await guardarContatos(id, d.enviadoPor, d.outrosEnvios)
      return updateDoc(doc(db, 'eventos', id), { status, ...semContatos, atualizadoEm: serverTimestamp() })
    }
  }
  return updateDoc(doc(db, 'eventos', id), { status, atualizadoEm: serverTimestamp() })
}

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
