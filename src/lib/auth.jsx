import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { auth, ADMIN_UIDS } from './firebase'

const Ctx = createContext({ user: null, isAdmin: false, carregando: true })

export function AuthProvider({ children }) {
  const [estado, setEstado] = useState({ user: null, isAdmin: false, carregando: true })
  useEffect(() => onAuthStateChanged(auth, (user) => {
    setEstado({ user, isAdmin: !!user && ADMIN_UIDS.includes(user.uid), carregando: false })
  }), [])
  return <Ctx.Provider value={estado}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
export const entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha)
export const sair = () => signOut(auth)
export const recuperarSenha = (email) => sendPasswordResetEmail(auth, email)
