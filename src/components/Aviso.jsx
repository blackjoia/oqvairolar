import { useEffect, useSyncExternalStore } from 'react'

// Aviso rápido no rodapé da tela (some sozinho). Use avisar('texto') de qualquer lugar.
let atual = null, timer = null
const ouvintes = new Set()
export function avisar(texto, ms = 4500) {
  atual = { texto, id: Date.now() }; ouvintes.forEach((f) => f())
  clearTimeout(timer); timer = setTimeout(() => { atual = null; ouvintes.forEach((f) => f()) }, ms)
}
export default function Aviso() {
  const a = useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f) }, () => atual)
  useEffect(() => () => clearTimeout(timer), [])
  if (!a) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4" role="status" aria-live="polite">
      <p key={a.id} className="conquista-cartao pointer-events-auto max-w-sm rounded-2xl bg-[#1a1630] px-4 py-3 text-sm font-semibold text-white shadow-2xl">{a.texto}</p>
    </div>
  )
}
