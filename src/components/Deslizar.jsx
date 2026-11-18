import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

// Linha de botões que desliza para o lado. Mostra um esmaecido e uma setinha
// no lado onde ainda tem mais opções, para a pessoa entender que dá para deslizar.
export default function Deslizar({ children, className = '' }) {
  const ref = useRef(null)
  const [lados, setLados] = useState({ esq: false, dir: false })
  useEffect(() => {
    const el = ref.current
    const medir = () => setLados({ esq: el.scrollLeft > 4, dir: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    medir()
    el.addEventListener('scroll', medir, { passive: true })
    const ro = new ResizeObserver(medir); ro.observe(el)
    return () => { el.removeEventListener('scroll', medir); ro.disconnect() }
  }, [])
  const ir = (d) => ref.current.scrollBy({ left: d * ref.current.clientWidth * 0.7, behavior: 'smooth' })
  const mascara = `linear-gradient(to right, ${lados.esq ? 'transparent, #000 40px' : '#000, #000'}, ${lados.dir ? '#000 calc(100% - 48px), transparent' : '#000, #000'})`
  return (
    <div className={`relative min-w-0 ${className}`}>
      <div ref={ref} className="no-scrollbar flex gap-2 overflow-x-auto" style={{ maskImage: mascara, WebkitMaskImage: mascara }}>
        {children}
      </div>
      {lados.esq && (
        <button type="button" onClick={() => ir(-1)} aria-label="Ver opções anteriores" tabIndex={-1}
          className="absolute left-0 inset-y-0 my-auto grid size-7 place-items-center rounded-full border border-line bg-surface text-ink shadow">
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      {lados.dir && (
        <button type="button" onClick={() => ir(1)} aria-label="Ver mais opções" tabIndex={-1}
          className="absolute right-0 inset-y-0 my-auto grid size-7 place-items-center rounded-full border border-line bg-surface text-ink shadow animate-[cutucar_1.6s_ease-in-out_2]">
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
