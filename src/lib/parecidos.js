// Acha eventos que provavelmente são o mesmo, mesmo com nomes diferentes.
// Ex.: "Rock Show no Plets" (enviado pela banda) e "Show de Rock" no local "Plets" (enviado pelo bar).
const PALAVRAS_VAZIAS = new Set(('a o as os ao aos à às de do da dos das no na nos nas em um uma com e ou para pra por ' +
  'show shows festa evento eventos noite especial edicao ao vivo live apresenta apresentam presents feat ft part ' +
  'bar pub the and com convidados convidado dj djs').split(' '))

export const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function palavras(t) {
  return normalizar(t).replace(/[^a-z0-9]+/g, ' ').split(' ').filter((p) => p.length > 1 && !PALAVRAS_VAZIAS.has(p))
}

// Junta título, local e atrações num só conjunto de palavras
function marcas(e) {
  return new Set([...palavras(e.titulo), ...palavras(e.localNome), ...(e.atracoes || []).flatMap(palavras), ...palavras(e.instagram)])
}

// 0 a 1: quanto os dois eventos parecem o mesmo
export function semelhanca(a, b) {
  if (!a.inicio || !b.inicio) return 0
  const horas = Math.abs(a.inicio - b.inicio) / 3600000
  if (horas > 20) return 0 // dias diferentes: não é o mesmo
  const A = marcas(a), B = marcas(b)
  if (!A.size || !B.size) return 0
  let comum = 0; A.forEach((p) => { if (B.has(p)) comum++ })
  let s = comum / Math.min(A.size, B.size) // quanto do menor está contido no maior
  const mesmoLocal = a.localNome && b.localNome && palavras(a.localNome).join(' ') === palavras(b.localNome).join(' ')
  if (mesmoLocal) s += horas <= 6 ? 0.35 : 0.15
  if (normalizar(a.cidade) && normalizar(b.cidade) && normalizar(a.cidade) !== normalizar(b.cidade)) s -= 0.4
  return Math.max(0, Math.min(1, s))
}

export function acharParecidos(evento, lista, minimo = 0.5) {
  return lista
    .filter((x) => x.id !== evento.id && x.status !== 'rejeitado')
    .map((x) => ({ evento: x, nota: semelhanca(evento, x) }))
    .filter((x) => x.nota >= minimo)
    .sort((a, b) => b.nota - a.nota)
}

// Junta um evento no outro: mantém o principal e completa o que estiver vazio.
export function juntar(principal, outro) {
  const r = { ...principal }
  for (const k of ['descricao', 'cartazUrl', 'ingressoUrl', 'preco', 'endereco', 'instagram', 'fim']) if (!r[k] && outro[k]) r[k] = outro[k]
  if (r.lat == null && outro.lat != null) { r.lat = outro.lat; r.lng = outro.lng }
  if (!r.localNome && outro.localNome) r.localNome = outro.localNome
  r.generos = [...new Set([...(r.generos || []), ...(outro.generos || [])])]
  const perfis = [principal.instagram, outro.instagram, ...(principal.atracoes || []), ...(outro.atracoes || [])]
    .filter(Boolean).map((p) => (/^@?[\w.]+$/.test(p) && !/\s/.test(p) && p.startsWith('@') ? p : p))
  r.atracoes = [...new Set(perfis.filter((p) => p !== r.instagram).map((p) => String(p).trim()).filter(Boolean))]
  const envios = [...(principal.outrosEnvios || []), ...(outro.enviadoPor ? [outro.enviadoPor] : []), ...(outro.outrosEnvios || [])]
  if (envios.length) r.outrosEnvios = envios
  if (outro.titulo && normalizar(outro.titulo) !== normalizar(principal.titulo)) r.outrosNomes = [...new Set([...(principal.outrosNomes || []), outro.titulo])]
  return r
}
