// Contas do público: perfil, "Meus rolês", quem vai, páginas oficiais de bares e bandas, seguir.
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit, getCountFromServer,
  serverTimestamp, arrayUnion, writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { clique } from './visitas'

// ---------- usuário ----------
export async function garantirUsuario(user) {
  const ref = doc(db, 'usuarios', user.uid)
  const s = await getDoc(ref)
  if (s.exists()) {
    const d = s.data()
    // Contas antigas ganham o campo da busca por nome (usado em Amigos).
    if (d.busca !== normalizar(d.nome)) await updateDoc(ref, { busca: normalizar(d.nome) }).catch(() => {})
    return { uid: user.uid, ...d }
  }
  const nome = (user.displayName || 'Sem nome').slice(0, 60)
  const novo = { nome, busca: normalizar(nome), foto: (user.photoURL || '').slice(0, 500), publico: true, criadoEm: serverTimestamp() }
  await setDoc(ref, novo)
  return { uid: user.uid, ...novo }
}
export async function buscarUsuario(uid) {
  const s = await getDoc(doc(db, 'usuarios', uid)).catch(() => null)
  return s?.exists() ? { uid, ...s.data() } : null
}
// Nome sem acento e em minúsculas, para a busca por nome em Amigos.
export const normalizar = (t = '') => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 60)

export const salvarUsuario = (uid, dados) => updateDoc(doc(db, 'usuarios', uid), {
  ...Object.fromEntries(Object.entries(dados).filter(([k]) => ['nome', 'publico'].includes(k))),
  ...(dados.nome ? { busca: normalizar(dados.nome) } : {}),
  atualizadoEm: serverTimestamp(),
})

// Passa para a conta o que a pessoa marcou neste aparelho antes de entrar.
export async function trazerMarcacoesDoAparelho(uid, publico) {
  let vid; try { vid = localStorage.getItem('vid') } catch {}
  if (!vid || vid === uid) return 0
  const snap = await getDocs(query(collection(db, 'presencas'), where('visitante', '==', vid))).catch(() => null)
  if (!snap?.size) return 0
  const lote = writeBatch(db)
  snap.docs.forEach((d) => {
    const p = d.data()
    lote.set(doc(db, 'presencas', `${p.eventoId}_${uid}`), { eventoId: p.eventoId, visitante: uid, uid, perfil: !!publico, tipo: p.tipo, em: serverTimestamp() })
    lote.delete(d.ref)
  })
  await lote.commit().catch(() => {})
  return snap.size
}

// ---------- meus rolês / quem vai ----------
export async function minhasPresencas(uid) {
  const snap = await getDocs(query(collection(db, 'presencas'), where('uid', '==', uid)))
  return snap.docs.map((d) => d.data())
}
export async function quemVai(eventoId, max = 12) {
  const snap = await getDocs(query(collection(db, 'presencas'), where('eventoId', '==', eventoId), where('tipo', '==', 'vou'), where('perfil', '==', true), limit(max)))
    .catch(() => null)
  const uids = (snap?.docs || []).map((d) => d.data().uid).filter(Boolean)
  if (!uids.length) return []
  // Leitura um a um: as regras só liberam o perfil de quem deixou público.
  const us = await Promise.all(uids.map(buscarUsuario))
  return us.filter((u) => u?.publico)
}
// Atualiza a marca "perfil" das presenças quando a pessoa liga/desliga o perfil público.
export async function atualizarVisibilidade(uid, publico) {
  const snap = await getDocs(query(collection(db, 'presencas'), where('uid', '==', uid)))
  const lote = writeBatch(db)
  snap.docs.forEach((d) => lote.update(d.ref, { perfil: !!publico, em: serverTimestamp() }))
  if (snap.size) await lote.commit()
}

// ---------- páginas oficiais (bar, banda, produtora) ----------
export async function buscarPerfil(slug) {
  const s = await getDoc(doc(db, 'perfis', slug)).catch(() => null)
  return s?.exists() ? { slug, ...s.data() } : null
}
export async function meusPerfis(uid) {
  const snap = await getDocs(query(collection(db, 'perfis'), where('donos', 'array-contains', uid))).catch(() => null)
  return (snap?.docs || []).map((d) => ({ slug: d.id, ...d.data() }))
}
export async function pedirPerfil({ slug, nome, tipo, uid, contato, mensagem }) {
  await setDoc(doc(db, 'pedidos', `${slug}_${uid}`), {
    slug, nome: nome.slice(0, 120), tipo, uid, contato: contato.slice(0, 120), mensagem: (mensagem || '').slice(0, 500),
    status: 'pendente', em: serverTimestamp(),
  })
  clique('pedir-perfil')
}
export async function meuPedido(slug, uid) {
  const s = await getDoc(doc(db, 'pedidos', `${slug}_${uid}`)).catch(() => null)
  return s?.exists() ? s.data() : null
}
// admin
export async function listarPedidos() {
  const snap = await getDocs(query(collection(db, 'pedidos'), where('status', '==', 'pendente')))
  const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  await Promise.all(lista.map(async (p) => { p.usuario = await buscarUsuario(p.uid) }))
  return lista
}
export async function responderPedido(p, aprovar) {
  if (aprovar) {
    const ref = doc(db, 'perfis', p.slug)
    const s = await getDoc(ref)
    if (s.exists()) await updateDoc(ref, { donos: arrayUnion(p.uid), atualizadoEm: serverTimestamp() })
    else await setDoc(ref, { nome: p.nome, tipo: p.tipo, donos: [p.uid], criadoEm: serverTimestamp() })
  }
  await updateDoc(doc(db, 'pedidos', p.id), { status: aprovar ? 'aprovado' : 'recusado', respondidoEm: serverTimestamp() })
}

// ---------- seguir ----------
const idSeg = (slug, uid) => `${slug}_${uid}`
export async function sigo(slug, uid) {
  const s = await getDoc(doc(db, 'seguidores', idSeg(slug, uid))).catch(() => null)
  return !!s?.exists()
}
export async function contarSeguidores(slug) {
  return getCountFromServer(query(collection(db, 'seguidores'), where('slug', '==', slug))).then((s) => s.data().count).catch(() => 0)
}
export async function seguir(slug, uid, nome) {
  await setDoc(doc(db, 'seguidores', idSeg(slug, uid)), { slug, uid, nome: (nome || slug).slice(0, 120), em: serverTimestamp() })
  clique('seguir')
}
export const deixarDeSeguir = (slug, uid) => deleteDoc(doc(db, 'seguidores', idSeg(slug, uid)))
export async function quemSigo(uid) {
  const snap = await getDocs(query(collection(db, 'seguidores'), where('uid', '==', uid))).catch(() => null)
  return (snap?.docs || []).map((d) => d.data())
}

// Endereço de notificação do aparelho, para avisos de evento novo de quem a pessoa segue.
export async function registrarAparelho(uid) {
  const { obterToken } = await import('./lembrete')
  const token = await obterToken()
  const ref = doc(db, 'aparelhos', uid)
  // Guarda até 10 aparelhos; se passar disso, recomeça só com este.
  await setDoc(ref, { tokens: arrayUnion(token), em: serverTimestamp() }, { merge: true })
    .catch(() => setDoc(ref, { tokens: [token], em: serverTimestamp() }))
}
