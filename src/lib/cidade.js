// Cidade preferida: escolhida na primeira vez que a pessoa abre o app e lembrada neste aparelho.
// '' = ainda não escolheu · 'todas' = quer ver tudo · nome da cidade
import { useSyncExternalStore } from 'react'

const CHAVE = 'cidadePreferida'
const ouvintes = new Set()
let atual = (() => { try { return localStorage.getItem(CHAVE) || '' } catch { return '' } })()

export function definirCidade(v) {
  atual = v || 'todas'
  try { localStorage.setItem(CHAVE, atual) } catch {}
  ouvintes.forEach((f) => f())
}
export function useCidadePreferida() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f) }, () => atual)
}
