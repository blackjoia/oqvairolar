// Eventos de exemplo, usados só no modo de desenvolvimento com ?demo na URL.
const h = (dias, hh, mm = 0) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(hh, mm, 0, 0); return d }
export const DEMO = [
  { id: 'noite-do-rock-demo', titulo: 'Noite do Rock com Os Tralhas', categoria: 'musica', generos: ['Rock', 'Cover'], inicio: h(0, 22), localNome: 'Bar do Zé', endereco: 'Rua Tenente Camargo, 1200', cidade: 'Francisco Beltrão', lat: -26.0811, lng: -53.055, preco: 'R$ 20', ingressoUrl: 'https://example.com', instagram: 'ostralhas', status: 'publicado', descricao: 'Três bandas, chopp gelado e muito rock.' },
  { id: 'samba-demo', titulo: 'Roda de Samba no Parque', categoria: 'musica', generos: ['Samba', 'Pagode'], inicio: h(1, 16), localNome: 'Parque Alvorada', cidade: 'Francisco Beltrão', gratuito: true, status: 'publicado' },
  { id: 'corrida-demo', titulo: 'Corrida Noturna 5K', categoria: 'esporte', generos: [], inicio: h(2, 19, 30), localNome: 'Praça Central', cidade: 'Pato Branco', preco: 'R$ 60 inscrição', status: 'publicado' },
  { id: 'eletronica-demo', titulo: 'Sunset Eletrônico', categoria: 'festa', generos: ['Eletrônica'], inicio: h(3, 18), localNome: 'Espaço Verde', cidade: 'Dois Vizinhos', preco: 'R$ 40', status: 'publicado' },
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
