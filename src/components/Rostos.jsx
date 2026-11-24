import { useAuth } from '../lib/auth'
import { useAmigos, rostosComAmigos } from '../lib/amigos-ctx'

// Rostinhos de quem vai (perfis públicos), sobrepostos. Cor de fundo fixa por nome quando não tem foto.
const CORES = ['#c2255c', '#c2410c', '#0f766e', '#3b5bdb', '#7e22ce', '#047857']
const corDe = (t = '') => CORES[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length]

export default function Rostos({ lista = [], max = 3, tamanho = 'size-6', anel = 'ring-surface' }) {
  return (
    <span className="flex -space-x-1.5" aria-hidden>
      {lista.slice(0, max).map((p) => p.foto
        ? <img key={p.uid} src={p.foto} alt="" referrerPolicy="no-referrer" loading="lazy" className={`${tamanho} rounded-full object-cover ring-2 ${p.amigo ? 'ring-accent' : anel}`} />
        : <span key={p.uid} className={`grid ${tamanho} place-items-center rounded-full text-[10px] font-bold text-white ring-2 ${p.amigo ? 'ring-accent' : anel}`} style={{ background: corDe(p.nome) }}>{p.nome?.[0]}</span>)}
    </span>
  )
}

// "Ana vai" · "Ana e mais 4 vão" · "5 pessoas vão"
export function textoQuemVai(e, comNomes) {
  const n = e.vao || 0
  if (!n) return ''
  const r = e.rostos || []
  if (comNomes && r.length) return n === 1 ? `${r[0].nome} vai` : `${r[0].nome} e mais ${n - 1} vão`
  return n === 1 ? '1 pessoa vai' : `${n} pessoas vão`
}

// Rostos e texto de "quem vai" de um card, com os amigos sempre na frente (anel limão).
export function useQuemVai(e) {
  const { user } = useAuth() || {}
  const { vao } = useAmigos()
  return quemVaiDe(e, user, vao)
}
export function quemVaiDe(e, user, vao = {}) {
  if (!veRostos(user)) return { rostos: [], texto: textoQuemVai(e, false), amigos: 0 }
  const { amigos, rostos } = rostosComAmigos(e, vao)
  const n = Math.max(e.vao || 0, amigos.length)
  return { rostos, amigos: amigos.length, texto: textoQuemVai({ ...e, vao: n, rostos }, rostos.length > 0) }
}

// Rostos só aparecem para quem entrou com a conta. Em desenvolvimento, ?demo&rostos simula alguém logado.
export const veRostos = (user) => !!user || (import.meta.env.DEV && /[?&]rostos/.test(location.search))
