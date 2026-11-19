import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Share2, X } from 'lucide-react'
import { nomeMes } from '../lib/ranking'

// Comemoração do ranking: medalha que cai com mola, brilho e confete uma vez só (sem repetir).
// Com "reduzir movimento" ligado, aparece só com um fade.
const MEDALHA = [
  { nome: 'Ouro', cor: '#f5b800', fundo: '#7a5a00', confete: 26 },
  { nome: 'Prata', cor: '#c9ced8', fundo: '#4b5160', confete: 16 },
  { nome: 'Bronze', cor: '#d08a4a', fundo: '#6b3b12', confete: 10 },
]
const CORES = ['#6d28ff', '#c6ff00', '#ff2e88', '#ffffff']

function textos(c) {
  const mes = nomeMes(c.mes)
  if (c.tipo === 'fechou') {
    const lugar = c.pos >= 0 ? `${c.pos + 1}º lugar` : null
    return {
      chamada: `Resultado de ${mes}`,
      titulo: c.pos >= 0 && c.pos < 3 ? `Você ficou em ${lugar}!` : c.bares.length ? `Dono da mesa do ${c.bares[0]}!` : `Você ficou em ${lugar}`,
      linha: [c.pos >= 0 ? `${c.n} ${c.n === 1 ? 'rolê' : 'rolês'} com check-in em ${mes}.` : '', c.pos >= 0 && c.bares.length ? `E terminou como Dono da mesa do ${c.bares.join(', ')}.` : '', 'O ranking zerou: a disputa deste mês já começou.'].filter(Boolean).join(' '),
      compartilhar: c.pos >= 0 && c.pos < 3 ? `Fiquei em ${lugar} no ranking de ${mes} do O Que Vai Rolar! 🏆` : `Fechei ${mes} no ranking do O Que Vai Rolar!`,
    }
  }
  const onde = c.onde ? `no ${c.onde}` : `no ranking de ${mes}`
  return {
    chamada: c.onde ? `Ranking do ${c.onde}` : `Ranking de ${mes}`,
    titulo: c.pos === 0 ? (c.onde ? 'Você é o Dono da mesa!' : 'Você está em 1º!') : c.pos === 1 ? `Você subiu para 2º ${onde}` : `Você entrou no pódio ${onde}`,
    linha: c.pos === 0 ? 'Agora é segurar a posição até o fim do mês. Cada "Tô aqui" conta.' : 'Mais alguns "Tô aqui" e o 1º lugar é seu.',
    compartilhar: c.pos === 0 && c.onde ? `Sou o Dono da mesa do ${c.onde} no O Que Vai Rolar! 👑` : `Estou em ${c.pos + 1}º ${onde} no O Que Vai Rolar! 🏆`,
  }
}

export default function Conquista({ c, fechar }) {
  const botao = useRef(null)
  const pos = c.pos >= 0 && c.pos < 3 ? c.pos : c.bares?.length ? 0 : -1
  const m = MEDALHA[pos] || null
  const t = textos(c)
  const link = `${location.origin}${c.slug ? `/local/${c.slug}` : '/ranking'}`

  useEffect(() => {
    botao.current?.focus()
    const esc = (e) => e.key === 'Escape' && fechar()
    addEventListener('keydown', esc)
    if (pos === 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.([30, 60, 30])
    return () => removeEventListener('keydown', esc)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const compartilhar = async () => {
    const dados = { title: 'O Que Vai Rolar?', text: t.compartilhar, url: link + '?o=conquista' }
    if (navigator.share) { try { await navigator.share(dados) } catch {} } else { try { await navigator.clipboard.writeText(`${t.compartilhar} ${dados.url}`) } catch {} }
  }

  return (
    <div className="conquista-fundo fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div role="dialog" aria-modal="true" aria-labelledby="conquista-titulo" aria-describedby="conquista-linha"
        className={`conquista-cartao ${pos === 0 ? 'ouro' : ''} relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#1a1630] px-6 pb-6 pt-10 text-center text-white ring-2 ring-inset ring-accent/50`}>
        <button ref={botao} onClick={fechar} aria-label="Fechar" className="absolute right-2 top-2 grid size-11 place-items-center rounded-full hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent"><X className="size-5" /></button>

        <div className="relative mx-auto size-32" style={m ? { '--cor': m.cor } : undefined}>
          {m && <><span className="raios" aria-hidden style={{ display: pos === 0 ? undefined : 'none' }} /><span className="onda" aria-hidden /></>}
          {pos === 0 && <Crown className="coroa absolute -top-9 left-1/2 z-10 -ml-6 size-12 text-accent drop-shadow-[0_2px_0_#1a1630]" aria-hidden />}
          {m && <div className="confete" aria-hidden>{Array.from({ length: m.confete }, (_, i) => {
            const ang = (i / m.confete) * 360 + (i % 3) * 7, dist = 70 + (i % 4) * 16
            return <i key={i} className={i % 4 === 0 ? 'estrela' : undefined} style={{ '--x': `${Math.cos(ang * Math.PI / 180) * dist}px`, '--y': `${Math.sin(ang * Math.PI / 180) * dist}px`, '--r': `${(i * 47) % 360}deg`, '--d': `${(i % 5) * 25}ms`, background: CORES[i % CORES.length] }} />
          })}</div>}
          <div className="medalha relative grid size-32 place-items-center rounded-full" style={{ background: m ? `radial-gradient(circle at 35% 30%, #fff8, transparent 45%), ${m.cor}` : '#2c2650', boxShadow: m ? `0 0 0 6px ${m.fundo}, 0 12px 40px ${m.cor}66` : 'none' }}>
            <span className="font-display text-6xl leading-none" style={{ color: m ? '#1a1630' : '#fff' }}>{c.pos >= 0 ? `${c.pos + 1}º` : '👑'}</span>
            {m && <span className="brilho" aria-hidden />}
          </div>
        </div>

        <p style={{ '--i': 0 }} className="conquista-texto mt-6 text-xs font-extrabold uppercase tracking-widest text-accent">{t.chamada}{m ? ` · ${m.nome}` : ''}</p>
        <h2 id="conquista-titulo" style={{ '--i': 1 }} className="conquista-texto mt-2 font-display text-4xl uppercase leading-none">{t.titulo}</h2>
        <p id="conquista-linha" style={{ '--i': 2 }} className="conquista-texto mt-3 text-sm opacity-85">{t.linha}</p>

        <div style={{ '--i': 3 }} className="conquista-texto mt-6 grid gap-2">
          <button onClick={compartilhar} className="btn-brand h-12 justify-center"><Share2 className="size-5" aria-hidden /> Contar pra galera</button>
          <Link to={c.slug ? `/local/${c.slug}` : '/ranking'} onClick={fechar} className="flex h-12 items-center justify-center rounded-xl border border-white/25 font-semibold text-white hover:bg-white/10">Ver o ranking</Link>
        </div>
      </div>
    </div>
  )
}
