import { categoria } from '../lib/constantes'

// Mostra o cartaz do evento ou, sem cartaz, um bloco com a cor da marca.
export default function Cartaz({ evento, className = '' }) {
  const cat = categoria(evento.categoria)
  if (evento.cartazUrl) {
    return <img src={evento.cartazUrl} alt={`Cartaz: ${evento.titulo}`} loading="lazy"
      className={`object-cover ${className}`} />
  }
  return (
    <div className={`grid place-items-center bg-gradient-to-br from-brand to-[#2a0d7a] ${className}`}>
      <span className="text-4xl" aria-hidden>{cat.emoji}</span>
    </div>
  )
}
