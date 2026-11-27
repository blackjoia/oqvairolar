// Cartazes do Cloudinary no tamanho certo para cada tela. Antes todo card baixava a versão de 1200 px,
// mesmo aparecendo com uns 180 px no celular (3 a 5 vezes mais dados do que o necessário).
const LARGURAS = [320, 480, 720, 1080]
const ehCloudinary = (u) => typeof u === 'string' && u.includes('res.cloudinary.com/') && u.includes('/image/upload/')

export function tamanho(url, w) {
  if (!ehCloudinary(url)) return url
  return url.replace(/\/image\/upload\/(?:f_auto,q_auto(?:,w_\d+)?\/)?/, `/image/upload/f_auto,q_auto,w_${w}/`)
}

export function srcSet(url) {
  if (!ehCloudinary(url)) return undefined
  return LARGURAS.map((w) => `${tamanho(url, w)} ${w}w`).join(', ')
}

// Quanto o cartaz ocupa na tela, para o navegador escolher o arquivo.
export const TAM_CARD = '(min-width: 1024px) 240px, (min-width: 768px) 24vw, (min-width: 540px) 31vw, 47vw'
export const TAM_LARGO = '(min-width: 1024px) 560px, (min-width: 640px) 55vw, 92vw'
export const TAM_PAGINA = '(min-width: 1024px) 380px, (min-width: 768px) 38vw, 92vw'
