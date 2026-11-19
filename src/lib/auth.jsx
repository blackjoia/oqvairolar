import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth, ADMIN_UIDS } from './firebase'

const Ctx = createContext({ user: null, isAdmin: false, carregando: true, usuario: null, perfis: [], recarregar: () => {} })

export function AuthProvider({ children }) {
  const [estado, setEstado] = useState({ user: null, isAdmin: false, carregando: true, usuario: null, perfis: [] })
  const carregarConta = useCallback(async (user) => {
    if (!user || user.isAnonymous || !user.providerData.some((p) => p.providerId === 'google.com')) return { usuario: null, perfis: [] }
    try {
      const { garantirUsuario, meusPerfis, trazerMarcacoesDoAparelho } = await import('./social')
      const usuario = await garantirUsuario(user)
      const [perfis] = await Promise.all([meusPerfis(user.uid), trazerMarcacoesDoAparelho(user.uid, usuario.publico)])
      return { usuario, perfis }
    } catch (e) { console.warn('conta', e); return { usuario: null, perfis: [] } }
  }, [])
  useEffect(() => onAuthStateChanged(auth, async (user) => {
    const base = { user, isAdmin: !!user && ADMIN_UIDS.includes(user.uid) }
    setEstado((s) => ({ ...s, ...base, carregando: !!user }))
    const conta = await carregarConta(user)
    setEstado({ ...base, ...conta, carregando: false })
  }), [carregarConta])
  const recarregar = useCallback(async () => {
    const conta = await carregarConta(auth.currentUser)
    setEstado((s) => ({ ...s, ...conta }))
  }, [carregarConta])
  return <Ctx.Provider value={{ ...estado, recarregar }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
export const entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha)
export const sair = () => signOut(auth)
export const recuperarSenha = (email) => sendPasswordResetEmail(auth, email)

export async function entrarComGoogle() {
  const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' })
  try { return await signInWithPopup(auth, p) }
  catch (e) {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return null
    if (e?.code === 'auth/popup-blocked') throw new Error('O navegador bloqueou a janela do Google. Libere pop-ups ou abra o site no Chrome/Safari.')
    if (e?.code === 'auth/operation-not-allowed') throw new Error('O login com Google ainda não foi ligado.')
    if (e?.code === 'auth/unauthorized-domain') throw new Error('Este endereço ainda não está liberado para login.')
    throw new Error('Não deu para entrar agora. Se estiver no Instagram ou WhatsApp, abra o site no navegador.')
  }
}
