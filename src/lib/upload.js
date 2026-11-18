// Envio de cartaz para o Cloudinary (plano grátis), com a foto reduzida no celular antes.
const NUVEM = import.meta.env.VITE_CLOUDINARY_CLOUD
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'oquevairolar'
export const uploadAtivo = !!NUVEM

export async function reduzirImagem(arquivo, max = 1600, qualidade = 0.82) {
  const bmp = await createImageBitmap(arquivo).catch(() => null)
  if (!bmp) return arquivo
  const esc = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * esc); c.height = Math.round(bmp.height * esc)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((ok) => c.toBlob((b) => ok(b || arquivo), 'image/jpeg', qualidade))
}

export async function enviarCartaz(arquivo) {
  if (!uploadAtivo) throw new Error('Envio de foto ainda não configurado.')
  const blob = await reduzirImagem(arquivo)
  const dados = new FormData()
  dados.append('file', blob, 'cartaz.jpg')
  dados.append('upload_preset', PRESET)
  dados.append('folder', 'cartazes')
  const r = await fetch(`https://api.cloudinary.com/v1_1/${NUVEM}/image/upload`, { method: 'POST', body: dados })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error?.message || 'Falha no envio da foto.')
  // Entrega já otimizada (formato e qualidade automáticos)
  return j.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/')
}
