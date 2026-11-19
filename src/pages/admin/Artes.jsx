import { useEffect, useMemo, useState } from 'react'
import { listarTodos } from '../../lib/eventos'
import { desenharArte, paginar, paraBlob, legenda, FORMATOS } from '../../lib/artes'
import { inicioDoDia, addDias } from '../../lib/datas'
import { Download, Share2, Copy, Check, RefreshCw } from 'lucide-react'

const dm = (d) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d).replace('.', '').replace(' de ', ' ')

function periodos() {
  const hoje = inicioDoDia(), dow = hoje.getDay()
  const domingo = addDias(hoje, (7 - dow) % 7)
  const seg = addDias(hoje, dow === 0 ? 1 : 8 - dow)
  const sexta = dow >= 5 || dow === 0 ? hoje : addDias(hoje, 5 - dow)
  return [
    { id: 'semana', nome: 'Esta semana', titulo: 'Agenda da semana', ini: hoje, fim: addDias(domingo, 1) },
    { id: 'fds', nome: 'Fim de semana', titulo: 'Agenda do fim de semana', ini: sexta, fim: addDias(domingo, 1) },
    { id: 'proxima', nome: 'Próxima semana', titulo: 'Agenda da semana', ini: seg, fim: addDias(seg, 7) },
    { id: 'hoje', nome: 'Hoje', titulo: 'Hoje vai rolar', ini: hoje, fim: addDias(hoje, 1) },
  ]
}

export default function Artes() {
  const [eventos, setEventos] = useState(null)
  const [per, setPer] = useState('semana')
  const [formato, setFormato] = useState('feed')
  const [imagens, setImagens] = useState([])
  const [copiado, setCopiado] = useState(false)
  const [gerando, setGerando] = useState(false)
  useEffect(() => { listarTodos().then(setEventos).catch(() => setEventos([])) }, [])

  const p = periodos().find((x) => x.id === per)
  const periodo = p.id === 'hoje' ? dm(p.ini) : `${dm(p.ini)} a ${dm(addDias(p.fim, -1))}`
  const lista = useMemo(() => (eventos || [])
    .filter((e) => e.status === 'publicado' && e.inicio >= p.ini && e.inicio < p.fim)
    .sort((a, b) => a.inicio - b.inicio), [eventos, per]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!eventos) return
    let vivo = true
    setGerando(true)
    ;(async () => {
      const pags = paginar(lista, formato)
      const out = []
      for (let i = 0; i < pags.length; i++) {
        const c = await desenharArte({ eventos: pags[i], formato, titulo: p.titulo, periodo, pagina: i + 1, total: pags.length })
        out.push({ url: c.toDataURL('image/png'), canvas: c })
      }
      if (vivo) { setImagens(out); setGerando(false) }
    })()
    return () => { vivo = false }
  }, [lista, formato, eventos]) // eslint-disable-line react-hooks/exhaustive-deps

  const nomeArq = (i) => `oquevairolar-${per}-${formato}${imagens.length > 1 ? '-' + (i + 1) : ''}.png`
  const baixar = (i) => { const a = document.createElement('a'); a.href = imagens[i].url; a.download = nomeArq(i); a.click() }
  const compartilhar = async () => {
    const files = await Promise.all(imagens.map(async (im, i) => new File([await paraBlob(im.canvas)], nomeArq(i), { type: 'image/png' })))
    if (navigator.canShare?.({ files })) { try { await navigator.share({ files, text: legenda(lista, p.titulo, periodo) }) } catch {} }
    else imagens.forEach((_, i) => baixar(i))
  }
  const copiar = async () => { await navigator.clipboard.writeText(legenda(lista, p.titulo, periodo)); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }

  return (
    <div>
      <h1 className="font-display text-4xl uppercase">Artes para as redes</h1>
      <p className="text-sm text-muted">A agenda pronta para postar no Instagram e no Facebook, no visual do site. Se tiver muitos eventos, vira um carrossel.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {periodos().map((x) => <button key={x.id} onClick={() => setPer(x.id)} className={`chip ${per === x.id ? 'chip-on' : ''}`}>{x.nome}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(FORMATOS).map(([k, v]) => <button key={k} onClick={() => setFormato(k)} className={`chip ${formato === k ? 'chip-on' : ''}`}>{v.nome}</button>)}
      </div>
      <p className="mt-3 text-sm font-semibold">{lista.length} {lista.length === 1 ? 'evento' : 'eventos'} · {periodo}{imagens.length > 1 ? ` · ${imagens.length} imagens` : ''}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={compartilhar} disabled={gerando || !imagens.length} className="btn-brand"><Share2 className="size-5" /> Compartilhar / postar</button>
        <button onClick={copiar} className="btn-ghost">{copiado ? <><Check className="size-5 text-brand" /> Legenda copiada</> : <><Copy className="size-5" /> Copiar legenda</>}</button>
      </div>

      {gerando && <p className="mt-4 flex items-center gap-2 text-muted"><RefreshCw className="size-4 animate-spin" /> Gerando…</p>}
      <div className={`mt-4 grid gap-4 ${formato === 'story' ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {imagens.map((im, i) => (
          <figure key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <img src={im.url} alt={`Arte ${i + 1}`} className="w-full" />
            <figcaption className="p-2"><button onClick={() => baixar(i)} className="btn-ghost w-full py-2 text-sm"><Download className="size-4" /> Baixar {imagens.length > 1 ? i + 1 : ''}</button></figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
