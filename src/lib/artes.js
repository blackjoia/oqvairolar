// Artes da agenda da semana para Instagram/Facebook, no visual da marca:
// violeta #6d28ff + limão #c6ff00, Anton nos títulos, Inter no texto, selo OQ com o Q girado.
import { categoria } from './constantes'

const V = '#6d28ff', V2 = '#2a0d7a', L = '#c6ff00', ESCURO = '#1a1630', BRANCO = '#ffffff'
const TZ = 'America/Sao_Paulo'
const f = (d, o) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...o }).format(d).replace('.', '')
export const FORMATOS = { feed: { w: 1080, h: 1350, nome: 'Feed (4:5)' }, story: { w: 1080, h: 1920, nome: 'Story (9:16)' } }

function selo(ctx, x, y, t) {
  ctx.save()
  ctx.fillStyle = V; ctx.beginPath(); ctx.roundRect(x, y, t, t, t * 0.22); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.stroke()
  ctx.font = `${t * 0.62}px Anton`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = BRANCO; ctx.fillText('O', x + t * 0.31, y + t * 0.76)
  ctx.translate(x + t * 0.69, y + t * 0.52); ctx.rotate(-18 * Math.PI / 180)
  ctx.fillStyle = L; ctx.fillText('Q', 0, t * 0.24)
  ctx.restore()
  ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = BRANCO
  ctx.font = `${t * 0.34}px Anton`; ctx.fillText('VAI', x + t + t * 0.2, y + t * 0.44)
  ctx.font = `${t * 0.46}px Anton`; ctx.fillText('ROLAR', x + t + t * 0.2, y + t * 0.92)
  const w = ctx.measureText('ROLAR').width; ctx.fillStyle = L; ctx.fillText('?', x + t + t * 0.2 + w, y + t * 0.92)
  ctx.restore()
}

function cortar(ctx, texto, largura) {
  if (ctx.measureText(texto).width <= largura) return texto
  let t = texto
  while (t.length > 3 && ctx.measureText(t + '…').width > largura) t = t.slice(0, -1)
  return t.trimEnd() + '…'
}

// Divide os eventos em páginas (carrossel) que cabem na arte
export function paginar(eventos, formato) {
  const altDisp = formato === 'story' ? 1000 : 590
  const ALT_DIA = 74, ALT_EV = 96
  const paginas = []; let atual = []; let usado = 0; let diaAtual = null
  for (const e of eventos) {
    const dia = f(e.inicio, { year: 'numeric', month: '2-digit', day: '2-digit' })
    const custo = (dia !== diaAtual ? ALT_DIA : 0) + ALT_EV
    if (usado + custo > altDisp && atual.length) { paginas.push(atual); atual = []; usado = 0; diaAtual = null }
    usado += (dia !== diaAtual ? ALT_DIA : 0) + ALT_EV; diaAtual = dia; atual.push(e)
  }
  if (atual.length) paginas.push(atual)
  return paginas.length ? paginas : [[]]
}

export async function desenharArte({ eventos, formato = 'feed', titulo = 'Agenda da semana', periodo = '', pagina = 1, total = 1 }) {
  await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('700 40px Inter'), document.fonts.load('400 30px Inter')]).catch(() => {})
  const { w: W, h: H } = FORMATOS[formato]
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, W * 0.5, H)
  g.addColorStop(0, V); g.addColorStop(1, V2)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // detalhe: grande "?" limão translúcido ao fundo
  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = L; ctx.font = `${H * 0.7}px Anton`; ctx.textAlign = 'right'; ctx.fillText('?', W + 60, H * 0.86); ctx.restore()

  const M = 72
  let y = formato === 'story' ? 150 : 80
  selo(ctx, M, y, 84)
  if (total > 1) { ctx.font = '700 30px Inter'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'right'; ctx.fillText(`${pagina}/${total}`, W - M, y + 54); ctx.textAlign = 'left' }
  y += 84 + 70

  // Título com destaque limão na última palavra, como no site
  const palavras = titulo.toUpperCase().split(' ')
  const ultima = palavras.pop(); const inicio = palavras.join(' ')
  ctx.textBaseline = 'alphabetic'
  let tam = 118; ctx.font = `${tam}px Anton`
  while ((ctx.measureText(inicio).width > W - 2 * M || ctx.measureText(ultima).width + 40 > W - 2 * M) && tam > 60) { tam -= 6; ctx.font = `${tam}px Anton` }
  if (inicio) { ctx.fillStyle = BRANCO; ctx.fillText(inicio, M, y + tam * 0.86); y += tam * 0.98 }
  const wU = ctx.measureText(ultima).width
  ctx.fillStyle = L; ctx.beginPath(); ctx.roundRect(M - 6, y + 4, wU + 28, tam * 1.02, 14); ctx.fill()
  ctx.fillStyle = ESCURO; ctx.fillText(ultima, M + 8, y + tam * 0.9)
  y += tam * 1.02 + 30
  if (periodo) { ctx.font = '700 38px Inter'; ctx.fillStyle = BRANCO; ctx.fillText(periodo.toUpperCase(), M, y + 30); y += 70 }
  y += 20

  if (!eventos.length) {
    ctx.font = '400 40px Inter'; ctx.fillStyle = 'rgba(255,255,255,.85)'
    ctx.fillText('Nenhum evento cadastrado nesse período.', M, y + 40)
  }
  let diaAtual = null
  for (const e of eventos) {
    const dia = f(e.inicio, { year: 'numeric', month: '2-digit', day: '2-digit' })
    if (dia !== diaAtual) {
      diaAtual = dia
      const rot = `${f(e.inicio, { weekday: 'short' })} ${f(e.inicio, { day: '2-digit' })}/${f(e.inicio, { month: '2-digit' })}`.toUpperCase()
      ctx.font = '42px Anton'
      const wr = ctx.measureText(rot).width
      ctx.fillStyle = L; ctx.beginPath(); ctx.roundRect(M, y + 8, wr + 36, 54, 12); ctx.fill()
      ctx.fillStyle = ESCURO; ctx.fillText(rot, M + 18, y + 50)
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(M + wr + 56, y + 35, W - 2 * M - wr - 56, 2)
      y += 74
    }
    const h = f(e.inicio, { hour: '2-digit', minute: '2-digit' }).replace(':00', 'H').replace(':', 'H')
    ctx.font = '40px Anton'; ctx.fillStyle = L; ctx.fillText(h, M, y + 44)
    const xT = M + 130
    ctx.font = '46px Anton'; ctx.fillStyle = BRANCO
    ctx.fillText(cortar(ctx, (e.titulo || '').toUpperCase(), W - M - xT), xT, y + 46)
    const cat = categoria(e.categoria)
    const info = [e.localNome, e.cidade, e.gratuito ? 'Grátis' : e.preco].filter(Boolean).join(' · ')
    ctx.fillStyle = cat.cor === V ? L : cat.cor; ctx.beginPath(); ctx.arc(xT + 9, y + 74, 8, 0, Math.PI * 2); ctx.fill()
    ctx.font = '400 30px Inter'; ctx.fillStyle = 'rgba(255,255,255,.85)'
    ctx.fillText(cortar(ctx, info, W - M - xT - 28), xT + 28, y + 84)
    y += 96
  }

  // Rodapé
  const yR = H - (formato === 'story' ? 210 : 110)
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(M, yR - 30, W - 2 * M, 2)
  ctx.font = '44px Anton'; ctx.fillStyle = BRANCO; ctx.fillText('OQUEVAIROLAR.COM.BR', M, yR + 30)
  ctx.font = '400 28px Inter'; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.textAlign = 'right'
  ctx.fillText('Agenda completa e divulgue grátis', W - M, yR + 24); ctx.textAlign = 'left'
  return c
}

export const paraBlob = (c) => new Promise((ok) => c.toBlob(ok, 'image/png'))

// Texto para a legenda do post
export function legenda(eventos, titulo, periodo) {
  let dia = null; const linhas = [`${titulo} ${periodo ? '· ' + periodo : ''}`.trim(), '']
  for (const e of eventos) {
    const d = `${f(e.inicio, { weekday: 'long' })}, ${f(e.inicio, { day: '2-digit' })}/${f(e.inicio, { month: '2-digit' })}`
    if (d !== dia) { if (dia) linhas.push(''); linhas.push('📅 ' + d.charAt(0).toUpperCase() + d.slice(1)); dia = d }
    linhas.push(`• ${f(e.inicio, { hour: '2-digit', minute: '2-digit' })} ${e.titulo}${e.localNome ? ' @ ' + e.localNome : ''}${e.instagram ? ' (@' + e.instagram.replace(/^@/, '') + ')' : ''}`)
  }
  linhas.push('', 'Agenda completa: oquevairolar.com.br', 'Vai ter rolê? Divulgue grátis no site.', '', '#sudoestedoparana #oquevairolar #franciscobeltrao #patobranco #doisvizinhos')
  return linhas.join('\n')
}
