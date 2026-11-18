// Gera a arte do evento no tamanho do Story (1080x1920) e compartilha ou baixa.
import { categoria } from './constantes'
import { rotuloDia, hora } from './datas'

const carregarImagem = (url) => new Promise((ok, erro) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => ok(img)
  img.onerror = erro
  img.src = url
})

function quebrar(ctx, texto, largura) {
  const linhas = []; let atual = ''
  texto.split(/\s+/).forEach((p) => {
    const t = atual ? atual + ' ' + p : p
    if (ctx.measureText(t).width > largura && atual) { linhas.push(atual); atual = p } else atual = t
  })
  if (atual) linhas.push(atual)
  return linhas
}

export async function gerarStory(e) {
  await Promise.all([document.fonts.load('120px Anton'), document.fonts.load('700 40px Inter')]).catch(() => {})
  const W = 1080, H = 1920
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  const cat = categoria(e.categoria)

  const g = ctx.createLinearGradient(0, 0, W * 0.6, H)
  g.addColorStop(0, cat.cor); g.addColorStop(1, cat.fundo)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // Cartaz (se a imagem permitir) ou o nome em letras grandes
  let y = 170
  let desenhouCartaz = false
  if (e.cartazUrl) {
    try {
      const img = await carregarImagem(e.cartazUrl)
      const w = 860, h = Math.min(1075, (img.height / img.width) * w)
      const x = (W - w) / 2
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 36); ctx.clip()
      const esc = Math.max(w / img.width, h / img.height)
      ctx.drawImage(img, x + (w - img.width * esc) / 2, y + (h - img.height * esc) / 2, img.width * esc, img.height * esc)
      ctx.restore()
      y += h + 70; desenhouCartaz = true
    } catch { /* imagem sem permissão: usa o texto */ }
  }

  ctx.fillStyle = cat.tinta
  ctx.textBaseline = 'top'
  const titulo = (e.titulo || '').toUpperCase()
  let tam = desenhouCartaz ? 96 : titulo.length > 30 ? 130 : 170
  ctx.font = `${tam}px Anton`
  let linhas = quebrar(ctx, titulo, 920)
  while (linhas.length > (desenhouCartaz ? 2 : 5) && tam > 60) { tam -= 10; ctx.font = `${tam}px Anton`; linhas = quebrar(ctx, titulo, 920) }
  if (!desenhouCartaz) y = 420
  linhas.forEach((l) => { ctx.fillText(l, 80, y); y += tam * 1.02 })
  y += 50

  // Selo da data em limão
  const data = `${rotuloDia(e.inicio).toUpperCase()} · ${hora(e.inicio)}`
  ctx.font = '64px Anton'
  const lw = ctx.measureText(data).width + 64
  ctx.fillStyle = '#c6ff00'; ctx.beginPath(); ctx.roundRect(80, y, lw, 104, 22); ctx.fill()
  ctx.fillStyle = '#1a1630'; ctx.fillText(data, 112, y + 18)
  y += 150

  ctx.fillStyle = cat.tinta
  ctx.font = '700 46px Inter'
  quebrar(ctx, [e.localNome, e.cidade].filter(Boolean).join(' · '), 920).slice(0, 2).forEach((l) => { ctx.fillText(l, 80, y); y += 60 })

  // Rodapé
  ctx.font = '60px Anton'; ctx.fillStyle = cat.tinta
  ctx.fillText('O QUE VAI ROLAR?', 80, H - 200)
  ctx.font = '600 40px Inter'; ctx.globalAlpha = 0.85
  ctx.fillText('oquevairolar.com.br', 80, H - 125)
  ctx.globalAlpha = 1

  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'))
  const arquivo = new File([blob], `${e.id}-story.png`, { type: 'image/png' })
  if (navigator.canShare?.({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], title: e.titulo }); return 'compartilhado' } catch { return 'cancelado' }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = arquivo.name; a.click()
  return 'baixado'
}
