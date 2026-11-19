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
