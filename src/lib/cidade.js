// Cidade preferida: escolhida na primeira vez que a pessoa abre o app e lembrada neste aparelho.
// '' = ainda não escolheu · 'todas' = quer ver tudo · nome da cidade
import { useSyncExternalStore } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from './firebase'

// Com conta Google, a cidade também fica guardada na conta (preferencias/{uid}) e volta em qualquer aparelho.
const contaGoogle = () => { const u = auth.currentUser; return u && u.providerData.some((p) => p.providerId === 'google.com') ? u : null }
const salvarNaConta = (v) => { const u = contaGoogle(); if (u) setDoc(doc(db, 'preferencias', u.uid), { cidade: v, em: serverTimestamp() }).catch(() => {}) }

const CHAVE = 'cidadePreferida'
const ouvintes = new Set()
let atual = (() => { try { return localStorage.getItem(CHAVE) || '' } catch { return '' } })()

function aplicar(v) {
  atual = v || 'todas'
  try { localStorage.setItem(CHAVE, atual) } catch {}
  ouvintes.forEach((f) => f())
}
export function definirCidade(v) { aplicar(v); salvarNaConta(atual) }

// Ao entrar com a conta: usa a última cidade da conta; se a conta ainda não tem, guarda a deste aparelho.
export async function sincronizarCidade(uid) {
  try {
    const s = await getDoc(doc(db, 'preferencias', uid))
    const daConta = s.exists() ? s.data().cidade : ''
    if (daConta) { if (daConta !== atual) aplicar(daConta) }
    else if (atual) salvarNaConta(atual)
  } catch { /* sem regra publicada ou sem rede: fica a do aparelho */ }
}
export function useCidadePreferida() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f) }, () => atual)
}
