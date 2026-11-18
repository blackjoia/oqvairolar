// Listas iniciais. Na próxima etapa elas passam a ser editadas no painel.
export const CATEGORIAS = [
  { id: 'musica', nome: 'Música', emoji: '🎸' },
  { id: 'festa', nome: 'Festa', emoji: '🪩' },
  { id: 'esporte', nome: 'Esporte e corrida', emoji: '🏃' },
  { id: 'cultura', nome: 'Cultura e teatro', emoji: '🎭' },
  { id: 'gastronomia', nome: 'Gastronomia', emoji: '🍔' },
  { id: 'outros', nome: 'Outros', emoji: '✨' },
]

export const GENEROS = [
  'Rock', 'Metal', 'Punk', 'Indie', 'Pop', 'Sertanejo', 'Pagode', 'Samba',
  'MPB', 'Eletrônica', 'Funk', 'Rap / Hip-hop', 'Reggae', 'Blues', 'Jazz',
  'Gaúcha / Nativista', 'Forró', 'Acústico', 'Cover', 'Autoral',
]

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
