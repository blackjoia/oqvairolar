// Gera uma página de prévia (para WhatsApp, Instagram, Facebook e Google) para cada evento publicado,
// com título, data, local e uma imagem 1200x630. Roda depois do "npm run build", dentro de dist/.
// Uso: GOOGLE_APPLICATION_CREDENTIALS=chave.json node scripts/previas.mjs   (ou --demo para testar sem banco)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

const SITE = 'https://oquevairolar.com.br'
const DIST = new URL('../dist/', import.meta.url)
const FONTE = new URL('./fontes/Anton-Regular.ttf', import.meta.url).pathname
const CORES = {
  musica: ['#6d28ff', '#2a0d7a'], festa: ['#ff2e88', '#7a0a3d'], esporte: ['#ff7a1a', '#8a2c00'],
  cultura: ['#00b8a9', '#004d47'], gastronomia: ['#ffb000', '#7a4a00'], outros: ['#4f46e5', '#1e1b6b'],
}
const TZ = 'America/Sao_Paulo'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dataLonga = (d, semHora = false) => {
  const dia = d.toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '')
  const h = d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).replace(':00', 'h').replace(':', 'h')
  return semHora ? dia : `${dia} · ${h}`
}
const dataCurta = (d, semHora = false) => {
  const p = (o) => d.toLocaleString('pt-BR', { timeZone: TZ, ...o }).replace('.', '')
  return `${p({ weekday: 'short' })} ${p({ day: 'numeric' })} ${p({ month: 'short' })}${semHora ? '' : ` · ${dataLonga(d).split(' · ')[1]}`}`.toUpperCase()
}

// Quebra o título em linhas pelo tamanho aproximado das letras da Anton
function quebrar(texto, larguraMax, tam, maxLinhas) {
  const porLinha = Math.max(6, Math.floor(larguraMax / (tam * 0.43)))
  const linhas = []; let atual = ''
  for (const p of String(texto).toUpperCase().split(/\s+/)) {
    if ((atual + ' ' + p).trim().length > porLinha && atual) { linhas.push(atual); atual = p } else atual = (atual + ' ' + p).trim()
  }
  if (atual) linhas.push(atual)
  if (linhas.length > maxLinhas) { linhas.length = maxLinhas; linhas[maxLinhas - 1] = linhas[maxLinhas - 1].replace(/\s*\S*$/, '') + '…' }
  return linhas
}

async function cartazEmbutido(url) {
  if (!url) return null
  try {
    const u = url.includes('res.cloudinary.com') ? url.replace(/\/upload\/(f_auto,q_auto,w_\d+\/)?/, '/upload/f_jpg,q_auto,w_600/') : url
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) })
    const tipo = r.headers.get('content-type') || ''
    if (!r.ok || !/image\/(jpeg|png)/.test(tipo)) return null
    return `data:${tipo.split(';')[0]};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`
  } catch { return null }
}

function imagem(e, cartaz) {
  const [c1, c2] = CORES[e.categoria] || CORES.outros
  const larg = cartaz ? 640 : 1060
  let tam = cartaz ? 80 : 100
  let linhas = quebrar(e.titulo, larg, tam, 3)
  if (linhas.length === 3) { tam = cartaz ? 66 : 82; linhas = quebrar(e.titulo, larg, tam, 3) }
  const lh = tam * 1.1
  const bloco = linhas.length * lh + 30 + 58
  const yTitulo = 150 + (380 - bloco) / 2 + tam * 0.86
  const yBadge = yTitulo + (linhas.length - 1) * lh + 34
  const local = [e.localNome, e.cidade].filter(Boolean).join(' · ').toUpperCase()
  const badge = dataCurta(e.inicio, e.semHora)
  const wBadge = badge.length * 14.5 + 44
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
  <clipPath id="cp"><rect x="770" y="50" width="380" height="530" rx="28"/></clipPath></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="70" y="54" width="62" height="62" rx="14" fill="#6d28ff" stroke="#ffffff" stroke-opacity=".25"/>
  <text x="89" y="101" text-anchor="middle" font-family="Anton" font-size="38" fill="#fff">O</text>
  <text x="113" y="101" text-anchor="middle" font-family="Anton" font-size="38" fill="#c6ff00" transform="rotate(-18 113 86)">Q</text>
  <text x="146" y="82" font-family="Anton" font-size="22" fill="#fff">VAI</text>
  <text x="146" y="111" font-family="Anton" font-size="28" fill="#fff">ROLAR<tspan fill="#c6ff00">?</tspan></text>
  ${linhas.map((l, i) => `<text x="70" y="${yTitulo + i * lh}" font-family="Anton" font-size="${tam}" fill="#fff">${esc(l)}</text>`).join('\n  ')}
  <rect x="70" y="${yBadge}" width="${wBadge}" height="58" rx="12" fill="#c6ff00"/>
  <text x="92" y="${yBadge + 41}" font-family="Anton" font-size="30" fill="#1a1630">${esc(badge)}</text>
  <text x="70" y="572" font-family="Anton" font-size="30" fill="#fff" fill-opacity=".9">${esc(local.slice(0, cartaz ? 38 : 64))}</text>
  ${cartaz ? `<image href="${cartaz}" x="770" y="50" width="380" height="530" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp)"/>` : ''}
</svg>`
  const png = new Resvg(svg, { font: { fontFiles: [FONTE], loadSystemFonts: false, defaultFontFamily: 'Anton' } }).render().asPng()
  // JPEG pequeno: o WhatsApp ignora imagens de prévia muito pesadas
  return sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
}

async function carregarEventos() {
  if (process.argv.includes('--demo')) {
    const h = (d, hh) => { const x = new Date(); x.setDate(x.getDate() + d); x.setUTCHours(hh + 3, 0, 0, 0); return x }
    return [
      { id: 'noite-do-rock-demo', titulo: 'Noite do Rock com Os Tralhas', categoria: 'musica', inicio: h(1, 22), localNome: 'Bar do Zé', cidade: 'Francisco Beltrão', preco: 'R$ 20' },
      { id: 'corrida-demo', titulo: 'Corrida Noturna 5K', categoria: 'esporte', inicio: h(2, 19), localNome: 'Praça Central', cidade: 'Pato Branco', gratuito: true },
      { id: 'festa-demo', titulo: 'Sunset Eletrônico de Verão no Espaço Verde com DJs convidados', categoria: 'festa', inicio: h(3, 18), localNome: 'Espaço Verde', cidade: 'Dois Vizinhos' },
    ]
  }
  const { initializeApp, applicationDefault } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  initializeApp({ credential: applicationDefault(), projectId: 'oquevairolar-b0129' })
  const s = await getFirestore().collection('eventos').where('status', '==', 'publicado').get()
  return s.docs.map((d) => { const v = d.data(); return { id: d.id, ...v, inicio: v.inicio.toDate(), fim: v.fim?.toDate?.() } })
}

const base = readFileSync(new URL('index.html', DIST), 'utf8')

// Só o que a tela usa: nada de quem enviou (contato), quem criou ou datas internas.
const PRIVADOS = new Set(['enviadoPor', 'outrosEnvios', 'criadoPor', 'criadoEm', 'atualizadoEm', 'origem', 'fonte', 'rev', 'status'])
function publico(e) {
  const o = {}
  for (const [k, v] of Object.entries(e)) {
    if (PRIVADOS.has(k) || v === undefined) continue
    o[k] = v?.toDate ? v.toDate().toISOString() : v instanceof Date ? v.toISOString() : v
  }
  return o
}
// JSON seguro dentro de <script> (não deixa fechar a tag).
const jsonNoHtml = (x) => JSON.stringify(x).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')

function pagina(e, temImagem) {
  const titulo = `${e.titulo} · O Que Vai Rolar?`
  const desc = [dataLonga(e.inicio, e.semHora), [e.localNome, e.cidade].filter(Boolean).join(', '), e.gratuito ? 'Grátis' : e.preco].filter(Boolean).join(' · ')
  const url = `${SITE}/evento/${e.id}`
  const img = temImagem ? `${SITE}/og/${e.id}.jpg` : `${SITE}/og.jpg`
  const troca = (html, re, valor) => { if (!re.test(html)) throw new Error('marcação não encontrada: ' + re); return html.replace(re, valor) }
  let h = base
  h = troca(h, /<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`)
  h = troca(h, /<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(desc)}"`)
  h = troca(h, /<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(e.titulo)}"`)
  h = troca(h, /<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(desc)}"`)
  h = troca(h, /<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${img}"`)
  h = troca(h, /<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
  h = troca(h, /<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="article"`)
  h = h.replace('</head>', `    <link rel="canonical" href="${url}" />\n  </head>`)
  // Os dados do evento já vêm na página: quem abre o link do Instagram/WhatsApp vê o evento sem esperar o banco.
  return h.replace('<div id="root"></div>', `<div id="root"></div>\n    <script id="dados-evento" type="application/json">${jsonNoHtml(publico(e))}</script>`)
}

const eventos = await carregarEventos()
const agora = Date.now()
mkdirSync(new URL('evento/', DIST), { recursive: true }); mkdirSync(new URL('og/', DIST), { recursive: true })
let n = 0
for (const e of eventos) {
  if (!/^[a-z0-9-]+$/.test(e.id) || !e.inicio) continue
  let temImagem = false
  try { writeFileSync(new URL(`og/${e.id}.jpg`, DIST), await imagem(e, await cartazEmbutido(e.cartazUrl))); temImagem = true } catch (err) { console.warn('imagem falhou', e.id, err.message) }
  writeFileSync(new URL(`evento/${e.id}.html`, DIST), pagina(e, temImagem)); n++
}
// Mapa do site para o Google (só eventos que ainda não passaram)
const futuros = eventos.filter((e) => (e.fim || e.inicio).getTime() > agora - 86400000)
// Cópia da agenda para a primeira visita abrir na hora (o app troca pela do banco assim que ela chega).
writeFileSync(new URL('agenda.json', DIST), JSON.stringify({
  geradoEm: new Date().toISOString(),
  eventos: eventos.filter((e) => e.inicio.getTime() > agora - 2 * 86400000).sort((a, b) => a.inicio - b.inicio).map(publico),
}))
// Páginas de locais e atrações (bares, bandas): prévia com o nome e quantos eventos vêm aí
const slug = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
const locais = new Map()
for (const e of futuros) {
  const nomes = [e.localNome, ...(e.atracoes || [])].filter(Boolean)
  for (const nome of nomes) { const k = slug(nome); if (!k) continue; const l = locais.get(k) || { nome, eventos: [] }; l.eventos.push(e); locais.set(k, l) }
}
mkdirSync(new URL('local/', DIST), { recursive: true })
for (const [k, l] of locais) {
  const ev = l.eventos.sort((a, b) => a.inicio - b.inicio)[0]
  const fake = { ...ev, titulo: l.nome, id: ev.id }
  let h = pagina(fake, true)
  const desc = `${l.eventos.length} ${l.eventos.length === 1 ? 'evento' : 'eventos'} na agenda. Próximo: ${ev.titulo}, ${dataLonga(ev.inicio, ev.semHora)}.`
  h = h.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(desc)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(desc)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE}/local/${k}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${SITE}/local/${k}"`)
  writeFileSync(new URL(`local/${k}.html`, DIST), h)
}
// Página "Esta semana": prévia no WhatsApp com quantos eventos vêm nos próximos 7 dias.
{
  const semana = futuros.filter((e) => e.inicio.getTime() < agora + 7 * 86400000)
  const t = 'Esta semana no Sudoeste do Paraná · O Que Vai Rolar?'
  const desc = semana.length
    ? `${semana.length} ${semana.length === 1 ? 'evento' : 'eventos'} nos próximos 7 dias: ${semana.slice(0, 3).map((e) => e.titulo).join(', ')}${semana.length > 3 ? ' e mais' : ''}.`
    : 'A agenda dos próximos 7 dias no Sudoeste do Paraná.'
  const base = readFileSync(new URL('index.html', DIST), 'utf8')
  const h = base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(desc)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(t)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(desc)}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE}/semana"`)
  writeFileSync(new URL('semana.html', DIST), h)
}
writeFileSync(new URL('sitemap.xml', DIST), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>hourly</changefreq></url>
  <url><loc>${SITE}/semana</loc><changefreq>daily</changefreq></url>
  <url><loc>${SITE}/divulgar</loc></url>
${futuros.map((e) => `  <url><loc>${SITE}/evento/${e.id}</loc></url>`).join('\n')}
${[...locais.keys()].map((k) => `  <url><loc>${SITE}/local/${k}</loc></url>`).join('\n')}
</urlset>
`)
writeFileSync(new URL('robots.txt', DIST), `User-agent: *\nDisallow: /admin\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`Prévias geradas: ${n} eventos, ${locais.size} locais/atrações (${futuros.length} eventos no sitemap).`)
