import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth'

// Amigos da conta, carregados uma vez por sessão: quem são, pedidos e em quais eventos eles vão.
const vazio = { amigos: [], recebidos: [], enviados: [], pessoas: {}, vao: {}, pronto: false }
const Ctx = createContext({ ...vazio, recarregar: () => {} })

export function AmigosProvider({ children }) {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState(vazio)
  const carregar = useCallback(async (uid) => {
    if (!uid) { setEstado(vazio); return }
    try {
      const m = await import('./amigos')
      const a = await m.minhasAmizades(uid)
      const todos = [...new Set([...a.amigos, ...a.recebidos, ...a.enviados])]
      const [perfis, vaoUids] = await Promise.all([m.perfisDe(todos), m.eventosDosAmigos(a.amigos)])
      const pessoas = Object.fromEntries(perfis.map((p) => [p.uid, p]))
      const vao = Object.fromEntries(Object.entries(vaoUids).map(([ev, us]) => [ev, us.map((u) => pessoas[u]).filter(Boolean)]))
      setEstado({ ...a, pessoas, vao, pronto: true })
    } catch (e) { console.warn('amigos', e); setEstado({ ...vazio, pronto: true }) }
  }, [])
  useEffect(() => { carregar(usuario?.uid) }, [usuario?.uid, carregar])
  const recarregar = useCallback(() => carregar(usuario?.uid), [usuario?.uid, carregar])
  return <Ctx.Provider value={{ ...estado, recarregar }}>{children}</Ctx.Provider>
}

export const useAmigos = () => useContext(Ctx)

// Junta os amigos que vão (primeiro) com os rostos públicos do evento, sem repetir.
export function rostosComAmigos(e, vao) {
  const amigos = (vao[e.id] || []).map((p) => ({ uid: p.uid, nome: p.nome?.split(' ')[0], foto: p.foto, amigo: true }))
  const outros = (e.rostos || []).filter((r) => !amigos.some((a) => a.uid === r.uid))
  return { amigos, rostos: [...amigos, ...outros] }
}
