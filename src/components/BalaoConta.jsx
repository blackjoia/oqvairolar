import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../lib/auth'

// Balãozinho que chama para o botão de conta ao abrir o site (não é popup: não escurece nem trava a tela).
// Aparece uma vez por aparelho, só para quem não tem conta, e some sozinho em 5 s (pausa com o mouse em cima).
const CHAVE = 'oqv-balao-conta-visto'
const DURACAO = 5000
const ATRASO = 800

const jaViu = () => { try { return localStorage.getItem(CHAVE) === '1' } catch { return false } }
const marcarVisto = () => { try { localStorage.setItem(CHAVE, '1') } catch { /* navegação privada */ } }

export default function BalaoConta({ onMostrar }) {
  const { usuario, carregando } = useAuth()
  const [fase, setFase] = useState('fora') // fora | dentro | saindo
  const [pausado, setPausado] = useState(false)
  const restante = useRef(DURACAO)

  // Espera o login ser conferido; quem tem conta nunca vê
  useEffect(() => {
    if (carregando || usuario || jaViu() || fase !== 'fora') return
    const t = setTimeout(() => { marcarVisto(); setFase('dentro') }, ATRASO)
    return () => clearTimeout(t)
  }, [carregando, usuario, fase])

  // Se a pessoa entrar enquanto o balão está aberto, ele sai
  useEffect(() => { if (usuario && fase === 'dentro') setFase('saindo') }, [usuario, fase])

  useEffect(() => { onMostrar?.(fase === 'dentro') }, [fase, onMostrar])

  // Contagem que pausa quando o mouse ou o foco está no balão
  useEffect(() => {
    if (fase !== 'dentro' || pausado) return
    const inicio = Date.now()
    const t = setTimeout(() => setFase('saindo'), restante.current)
    return () => { clearTimeout(t); restante.current -= Date.now() - inicio }
  }, [fase, pausado])

  useEffect(() => {
    if (fase !== 'saindo') return
    const t = setTimeout(() => setFase('fim'), 220)
    return () => clearTimeout(t)
  }, [fase])

  if (fase === 'fora' || fase === 'fim') return null
  return (
    <div role="status" className={`balao-conta ${fase === 'saindo' ? 'saindo' : ''} ${pausado ? 'pausado' : ''}`}
      onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)} onBlur={() => setPausado(false)}>
      <p className="balao-conta-titulo">Crie sua conta <span>grátis</span></p>
      <p className="balao-conta-texto">Marque “Eu vou” nos rolês e não perca nenhum.</p>
      <button type="button" onClick={() => setFase('saindo')} aria-label="Fechar aviso" className="balao-conta-x"><X className="size-4" aria-hidden /></button>
      <span className="balao-conta-barra" style={{ '--dur': `${DURACAO}ms` }} aria-hidden><i /></span>
    </div>
  )
}
