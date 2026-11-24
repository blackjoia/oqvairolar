import { Guitar, PartyPopper, Footprints, Drama, UtensilsCrossed, Sparkles } from 'lucide-react'

// Listas iniciais. Na próxima etapa elas passam a ser editadas no painel.
// cor/fundo: usadas no cartaz automático; tinta: cor do texto sobre o fundo.
export const CATEGORIAS = [
  { id: 'musica', nome: 'Música', Icone: Guitar, cor: '#6d28ff', fundo: '#2a0d7a', tinta: '#ffffff' },
  { id: 'festa', nome: 'Festa', Icone: PartyPopper, cor: '#ff2e88', fundo: '#7a0a3d', tinta: '#ffffff' },
  { id: 'esporte', nome: 'Esporte e corrida', curto: 'Esporte', Icone: Footprints, cor: '#ff7a1a', fundo: '#8a2c00', tinta: '#ffffff' },
  { id: 'cultura', nome: 'Cultura e teatro', curto: 'Cultura', Icone: Drama, cor: '#00b8a9', fundo: '#004d47', tinta: '#ffffff' },
  { id: 'gastronomia', nome: 'Gastronomia', Icone: UtensilsCrossed, cor: '#ffb000', fundo: '#7a4a00', tinta: '#1a1630' },
  { id: 'outros', nome: 'Outros', Icone: Sparkles, cor: '#4f46e5', fundo: '#1e1b5c', tinta: '#ffffff' },
]

export const GENEROS = [
  'Rock', 'Metal', 'Punk', 'Indie', 'Pop', 'Sertanejo', 'Pagode', 'Samba',
  'MPB', 'Eletrônica', 'Funk', 'Rap / Hip-hop', 'Reggae', 'Blues', 'Jazz',
  'Gaúcha / Nativista', 'Bailão', 'Forró', 'Gospel', 'Acústico', 'Cover', 'Autoral',
]

// Subfiltros de cada categoria (aparecem embaixo das abas quando a pessoa escolhe uma).
// Ficam gravados no campo "generos" do evento. "inclui": outros nomes que contam como o mesmo.
// A lista segue o que mais rola no Sudoeste do Paraná; na tela só aparecem os que têm evento.
// FIXOS: ficam sempre em primeiro na categoria e aparecem mesmo sem evento (pedido do Luis).
export const FIXOS = { musica: ['Rock'] }
export const SUBFILTROS = {
  musica: [
    'Rock', 'Sertanejo', { nome: 'Pagode e samba', inclui: ['Pagode', 'Samba'] }, 'Eletrônica',
    { nome: 'Bailão e gaúcha', inclui: ['Bailão', 'Gaúcha / Nativista', 'Gaúcha', 'Nativista'] },
    'Acústico', 'Pop', 'MPB', 'Metal', 'Punk', 'Funk', { nome: 'Rap e hip-hop', inclui: ['Rap / Hip-hop', 'Rap', 'Hip-hop'] },
    'Blues', 'Reggae', 'Forró', 'Jazz', 'Indie', 'Gospel',
  ],
  festa: ['Eletrônica', 'Funk', 'Sertanejo', 'Universitária', 'Na piscina', 'Open bar', 'Temática', 'Junina', 'Réveillon e Carnaval'],
  esporte: ['Futsal', 'Futebol', 'Corrida de rua', 'Caminhada', 'Ciclismo e MTB', 'Trilha de moto', 'Motocross e velocross', 'Vôlei e beach tennis', 'Lutas', 'Rodeio e laço'],
  cultura: ['Teatro', 'Humor e stand-up', 'Dança', 'Cinema', 'Exposição', 'Tradicionalista (CTG)', 'Infantil', 'Literatura', 'Palestra'],
  gastronomia: ['Festival', 'Churrasco e costelão', 'Cerveja artesanal', 'Festa de comunidade', 'Food truck e feira', 'Café colonial', 'Vinho'],
  outros: ['Feira e exposição', 'Solidário', 'Religioso', 'Infantil', 'Natal', 'Curso e oficina'],
}

const semAcento = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const def = (s) => (typeof s === 'string' ? { nome: s, inclui: [] } : s)
export const subfiltros = (cat) => (SUBFILTROS[cat] || []).map(def)
// Nomes para marcar no cadastro: música usa a lista completa de gêneros.
export const opcoesSub = (cat) => (cat === 'musica' ? GENEROS : subfiltros(cat).map((s) => s.nome))
export const rotuloSub = (cat) => (cat === 'musica' ? 'Gêneros / estilos' : 'Tipo de evento')

// O evento entra no subfiltro "nome"? Procura a definição na categoria do evento (ou em qualquer uma).
export function casaSub(e, nome) {
  const lista = subfiltros(e.categoria).concat(...Object.keys(SUBFILTROS).map(subfiltros))
  const d = lista.find((s) => semAcento(s.nome) === semAcento(nome)) || { nome, inclui: [] }
  const alvos = [d.nome, ...d.inclui].map(semAcento)
  return (e.generos || []).some((g) => alvos.includes(semAcento(g)))
}

export const CIDADES = [
  'Francisco Beltrão', 'Pato Branco', 'Dois Vizinhos', 'Marmeleiro', 'Realeza',
  'Ampére', 'Santo Antônio do Sudoeste', 'Capanema', 'Enéas Marques',
  'Verê', 'Renascença', 'Salgado Filho', 'Nova Esperança do Sudoeste',
]

export const STATUS = {
  publicado: { nome: 'Publicado', cor: 'bg-accent text-on-accent' },
  pendente: { nome: 'Pendente', cor: 'bg-amber-400 text-black' },
  rascunho: { nome: 'Rascunho', cor: 'bg-surface-2 text-muted' },
  rejeitado: { nome: 'Rejeitado', cor: 'bg-danger text-white' },
}

export const categoria = (id) => CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1]
