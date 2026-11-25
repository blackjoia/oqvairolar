// Relatório de estatísticas (só leitura). Gera um resumo em Markdown com números agregados, sem dados pessoais.
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
initializeApp({ credential: applicationDefault(), projectId: 'oquevairolar-b0129' })
const db = getFirestore()
const DESDE = new Date('2026-11-19T15:20:00-03:00')
const agora = Date.now()
const sp = (d, o) => d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', ...o })
const dia = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const conta = (arr, f) => { const m = new Map(); arr.forEach((x) => { const k = f(x); if (k != null && k !== '') m.set(k, (m.get(k) || 0) + 1) }); return [...m].sort((a, b) => b[1] - a[1]) }
const tab = (t, linhas, cab = ['Item', 'N']) => `\n### ${t}\n| ${cab.join(' | ')} |\n| ${cab.map(() => '---').join(' | ')} |\n${linhas.map((l) => `| ${l.join(' | ')} |`).join('\n')}\n`

const vs = (await db.collection('visitas').where('em', '>=', Timestamp.fromDate(DESDE)).get()).docs.map((d) => { const v = d.data(); return { ...v, em: v.em.toDate() } })
const evs = (await db.collection('eventos').get()).docs.map((d) => ({ id: d.id, ...d.data(), inicio: d.data().inicio?.toDate?.() }))
const nome = new Map(evs.map((e) => [e.id, e]))
const pres = (await db.collection('presencas').get()).docs.map((d) => d.data())
const usuarios = (await db.collection('usuarios').get()).docs.map((d) => d.data())
const seg = (await db.collection('seguidores').get().catch(() => ({ size: 0 }))).size
const lemb = (await db.collection('lembretes').get().catch(() => ({ size: 0 }))).size

let out = `# Relatório de estatísticas · ${sp(new Date(), { dateStyle: 'short', timeStyle: 'short' })}\nContando desde 19/11 15h20 (admin não conta).\n`
for (const [rot, dias] of [['Últimos 7 dias', 7], ['Desde o início', 99]]) {
  const ini = Math.max(agora - dias * 864e5, DESDE.getTime())
  const v = vs.filter((x) => x.em.getTime() >= ini)
  const pag = v.filter((x) => x.tipo === 'pagina'), cl = v.filter((x) => x.tipo === 'clique'), fi = v.filter((x) => x.tipo === 'filtro')
  const pessoas = new Set(pag.map((x) => x.visitante))
  const abriramEv = new Set(pag.filter((x) => x.eventoId).map((x) => x.visitante))
  const porPessoaDias = new Map(); pag.forEach((x) => { const s = porPessoaDias.get(x.visitante) || new Set(); s.add(dia(x.em)); porPessoaDias.set(x.visitante, s) })
  const voltaram = [...porPessoaDias.values()].filter((s) => s.size > 1).length
  const sess = new Map(); pag.forEach((x) => { if (!sess.has(x.sessao)) sess.set(x.sessao, x) })
  out += `\n## ${rot}\n- Visitantes (aparelhos): ${pessoas.size} · voltaram em outro dia: ${voltaram}\n- Sessões: ${sess.size} · páginas vistas: ${pag.length} · páginas por sessão: ${(pag.length / Math.max(1, sess.size)).toFixed(1)}\n- Abriram algum evento: ${abriramEv.size} (${Math.round(abriramEv.size / Math.max(1, pessoas.size) * 100)}%)\n- Primeiros acessos (nova=true): ${pag.filter((x) => x.nova).length}\n`
  out += tab('Visitantes por dia', conta(pag, (x) => dia(x.em)).sort((a, b) => a[0].localeCompare(b[0])).map(([k]) => [k, new Set(pag.filter((x) => dia(x.em) === k).map((x) => x.visitante)).size, pag.filter((x) => dia(x.em) === k).length]), ['Dia', 'Visitantes', 'Páginas'])
  out += tab('Origem (por sessão)', conta([...sess.values()], (x) => x.origem).slice(0, 15).map(([k, n]) => [k, n, cl.filter((c) => c.origem === k && c.acao === 'eu-vou').length]), ['Origem', 'Sessões', 'Cliques Eu vou'])
  out += tab('Aparelho', conta([...sess.values()], (x) => x.disp))
  out += tab('Páginas mais vistas', conta(pag, (x) => x.pagina.startsWith('/evento/') ? '/evento/*' : x.pagina).slice(0, 12))
  out += tab('Eventos mais vistos', conta(pag.filter((x) => x.eventoId), (x) => x.eventoId).slice(0, 15).map(([id, n]) => [(nome.get(id)?.titulo || id).slice(0, 50), nome.get(id)?.cidade || '', nome.get(id)?.categoria || '', n, new Set(pag.filter((x) => x.eventoId === id).map((x) => x.visitante)).size]), ['Evento', 'Cidade', 'Cat', 'Vistas', 'Pessoas'])
  out += tab('Cliques', conta(cl, (x) => x.acao).map(([k, n]) => [k, n, new Set(cl.filter((c) => c.acao === k).map((c) => c.visitante)).size]), ['Ação', 'Cliques', 'Pessoas'])
  out += tab('Filtros usados', conta(fi, (x) => `${x.acao}: ${x.valor}`).slice(0, 15))
  out += tab('Hora das visitas (BRT)', conta(pag, (x) => sp(x.em, { hour: '2-digit', hour12: false })).sort((a, b) => a[0].localeCompare(b[0])))
  out += tab('Dia da semana', conta(pag, (x) => sp(x.em, { weekday: 'short' })))
}
const fut = evs.filter((e) => e.status === 'publicado' && e.inicio && e.inicio.getTime() > agora - 6 * 36e5)
out += `\n## Base\n- Contas criadas: ${usuarios.length} (perfil público: ${usuarios.filter((u) => u.publico).length})\n- Presenças: ${pres.length} (Eu vou: ${pres.filter((p) => p.tipo === 'vou').length}, Interesse: ${pres.filter((p) => p.tipo === 'interesse').length}, com conta: ${pres.filter((p) => p.uid).length})\n- Seguidores de páginas: ${seg} · lembretes pendentes: ${lemb}\n- Eventos publicados futuros: ${fut.length} · com cartaz: ${fut.filter((e) => e.cartazUrl).length} · com lat/lng: ${fut.filter((e) => e.lat).length}\n`
out += tab('Eventos futuros por cidade', conta(fut, (e) => e.cidade))
out += tab('Eventos futuros por categoria', conta(fut, (e) => e.categoria))
out += tab('Eventos futuros por origem', conta(fut, (e) => e.origem || 'admin/importar'))
out += tab('Mais Eu vou (futuros)', fut.filter((e) => e.vao).sort((a, b) => b.vao - a.vao).slice(0, 10).map((e) => [e.titulo.slice(0, 50), e.cidade, e.vao, e.acessos7 || 0]), ['Evento', 'Cidade', 'Vão', 'Acessos 7d'])
console.log(out)
import('node:fs').then((fs) => fs.writeFileSync('relatorio.md', out))
