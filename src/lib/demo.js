// Eventos de exemplo, usados só no modo de desenvolvimento com ?demo na URL.
const h = (dias, hh, mm = 0) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(hh, mm, 0, 0); return d }
export const DEMO = [
  { id: 'noite-do-rock-demo', titulo: 'Noite do Rock com Os Tralhas', atracoes: ['Os Tralhas'], categoria: 'musica', generos: ['Rock', 'Cover'], inicio: h(0, 22), localNome: 'Bar do Zé', endereco: 'Rua Tenente Camargo, 1200', cidade: 'Francisco Beltrão', lat: -26.0811, lng: -53.055, preco: 'R$ 20', ingressoUrl: 'https://example.com', instagram: 'ostralhas', status: 'publicado', descricao: 'Três bandas, chopp gelado e muito rock.' },
  { id: 'samba-demo', titulo: 'Roda de Samba no Parque', categoria: 'musica', generos: ['Samba', 'Pagode'], inicio: h(1, 16), localNome: 'Parque Alvorada', cidade: 'Francisco Beltrão', gratuito: true, status: 'publicado' },
  { id: 'corrida-demo', titulo: 'Corrida Noturna 5K', categoria: 'esporte', generos: [], inicio: h(2, 19, 30), localNome: 'Praça Central', cidade: 'Pato Branco', preco: 'R$ 60 inscrição', status: 'publicado' },
  { id: 'eletronica-demo', titulo: 'Sunset Eletrônico', categoria: 'festa', generos: ['Eletrônica'], inicio: h(3, 18), localNome: 'Espaço Verde', cidade: 'Dois Vizinhos', preco: 'R$ 40', status: 'publicado' },
  { id: 'jazz-demo', titulo: 'Jazz no Café', categoria: 'musica', inicio: h(1, 20), localNome: 'Café Central', cidade: 'Francisco Beltrão', preco: 'R$ 15', status: 'publicado' },
  { id: 'teatro-demo', titulo: 'Peça Infantil: O Pequeno Príncipe', categoria: 'cultura', inicio: h(2, 15), localNome: 'Teatro Municipal', cidade: 'Francisco Beltrão', gratuito: true, status: 'publicado' },
  { id: 'feira-demo', titulo: 'Feira Gastronômica do Sudoeste', categoria: 'gastronomia', inicio: h(3, 11), localNome: 'Parque de Exposições', cidade: 'Francisco Beltrão', gratuito: true, status: 'publicado' },
  { id: 'pagode-demo', titulo: 'Pagode do Domingão', categoria: 'musica', inicio: h(4, 17), localNome: 'Bar do Zé', cidade: 'Francisco Beltrão', preco: 'R$ 10', status: 'publicado' },
  { id: 'festa-demo', titulo: 'Festa na Vila: Memórias de Natal', categoria: 'gastronomia', inicio: h(1, 11), fim: h(3, 23), localNome: 'Parque de Exposições', cidade: 'Francisco Beltrão', lat: -26.0668, lng: -53.0395, status: 'publicado', descricao: 'Três dias de gastronomia e shows.' },
  { id: 'show1-demo', pai: 'festa-demo', titulo: 'Show Sudobanda na Festa na Vila', categoria: 'musica', inicio: h(1, 17), fim: h(1, 19), localNome: 'Parque de Exposições', cidade: 'Francisco Beltrão', status: 'publicado' },
  { id: 'show2-demo', pai: 'festa-demo', titulo: 'Show Diretoria do Pagode na Festa na Vila', categoria: 'musica', generos: ['Pagode'], inicio: h(3, 19), fim: h(3, 23), localNome: 'Parque de Exposições', cidade: 'Francisco Beltrão', status: 'publicado' },
  { id: 'metal-demo', titulo: 'Metal Fest Sudoeste', categoria: 'musica', generos: ['Metal', 'Autoral'], inicio: h(6, 20), localNome: 'Galpão 77', cidade: 'Francisco Beltrão', preco: 'R$ 35', status: 'publicado' },
]

// Visitas de exemplo para o painel de estatísticas (só no modo de desenvolvimento).
export function visitasDemo(dias) {
  const r = (n) => Math.floor(Math.random() * n), out = []
  const origens = ['instagram', 'instagram', 'instagram', 'direto', 'direto', 'compartilhado', 'google', 'facebook']
  for (let v = 0; v < 40 * dias; v++) {
    const visitante = 'v' + r(25 * dias), sessao = 's' + v, origem = origens[r(origens.length)], disp = r(10) < 8 ? 'celular' : 'computador'
    const d = new Date(Date.now() - r(dias) * 86400000); const hh = [12, 18, 19, 20, 21, 22, 22, 23, 10, 14][r(10)]; d.setHours(hh, r(60))
    const base = { visitante, sessao, origem, disp, em: d }
    out.push({ ...base, tipo: 'pagina', pagina: '/', nova: true })
    if (r(10) < 7) { const ev = DEMO[Math.min(r(6), r(6), 4)]; out.push({ ...base, tipo: 'pagina', pagina: '/evento/' + ev.id, eventoId: ev.id })
      if (r(10) < 3) out.push({ ...base, tipo: 'clique', acao: ['ingresso', 'agenda', 'compartilhar', 'rota', 'story'][r(5)], eventoId: ev.id }) }
    if (r(10) < 3) out.push({ ...base, tipo: 'filtro', acao: ['dia', 'categoria', 'cidade'][r(3)], valor: ['fds', 'musica', 'Francisco Beltrão', 'hoje', 'festa'][r(5)] })
  }
  if (dias >= 7) out.push({ visitante: 'x', sessao: 'x', origem: 'direto', disp: 'celular', em: new Date(), tipo: 'clique', acao: 'divulgar-enviado' })
  return out
}

// Shows que já passaram, para mostrar o histórico de uma banda no modo ?demo.
export const DEMO_PASSADOS = [
  ['Os Tralhas no Formosa Pub', -6, 'Formosa Pub', 'Francisco Beltrão', 'Couvert R$ 10'],
  ['Rock na Praça', -13, 'Praça Central', 'Pato Branco', null],
  ['Sextou com Os Tralhas', -20, 'Bar do Plets', 'Francisco Beltrão', 'Couvert free'],
  ['Festival de Inverno', -41, 'Parque de Exposições', 'Dois Vizinhos', 'R$ 30'],
  ['Os Tralhas na Choperia', -55, 'Choperia Central', 'Ampére', 'R$ 15'],
  ['Noite Cover', -69, 'Avenida Bombar', 'Pato Branco', 'R$ 20'],
  ['Aniversário do Bar do Zé', -90, 'Bar do Zé', 'Francisco Beltrão', 'R$ 20'],
  ['Rock Solidário', -120, 'Clube Comercial', 'Realeza', '1 kg de alimento'],
].map(([titulo, dias, localNome, cidade, preco], i) => ({ id: `passado-${i}-demo`, titulo, atracoes: ['Os Tralhas'], categoria: 'musica', generos: ['Rock', 'Cover'], inicio: h(dias, 22), localNome, cidade, preco, gratuito: !preco, instagram: 'ostralhas', status: 'publicado' }))
