import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPedidos, responderPedido } from '../../lib/social'
import { BadgeCheck, X, Store, Mic2 } from 'lucide-react'

// Pedidos de bares e bandas que querem assumir a própria página.
export default function Pedidos() {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState('')
  const carregar = () => listarPedidos().then(setLista).catch((e) => { console.error(e); setErro('Não deu para carregar os pedidos.') })
  useEffect(() => { carregar() }, [])
  const responder = async (p, ok) => {
    try { await responderPedido(p, ok); setLista((l) => l.filter((x) => x.id !== p.id)) } catch (e) { console.error(e); setErro('Não deu para salvar.') }
  }
  return (
    <div>
      <h1 className="font-display text-4xl uppercase">Pedidos de página</h1>
      <p className="mt-1 text-muted">Bares e bandas que pediram para assumir a página. Aprovando, a pessoa pode publicar eventos direto, sem passar pela fila.</p>
      {erro && <p className="mt-4 rounded-xl bg-danger/10 p-3 text-danger">{erro}</p>}
      {!lista && !erro && <div className="esqueleto mt-6 h-24 rounded-2xl" />}
      {lista && !lista.length && <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-muted">Nenhum pedido esperando.</p>}
      <ul className="mt-6 grid gap-3">
        {lista?.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4">
            {p.usuario?.foto ? <img src={p.usuario.foto} alt="" referrerPolicy="no-referrer" className="size-12 rounded-xl object-cover" /> : <span className="size-12 rounded-xl bg-surface-2" />}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.usuario?.nome || 'Sem nome'} quer assumir <Link to={`/local/${p.slug}`} className="text-brand">{p.nome}</Link>
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-bold uppercase text-muted">{p.tipo === 'local' ? <Store className="size-3" /> : <Mic2 className="size-3" />}{p.tipo === 'local' ? 'Local' : 'Atração'}</span></p>
              <p className="text-sm text-muted">Contato: <b className="text-ink">{p.contato}</b>{p.mensagem ? ` · “${p.mensagem}”` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => responder(p, false)} className="btn-ghost"><X className="size-4" /> Recusar</button>
              <button onClick={() => responder(p, true)} className="btn-brand"><BadgeCheck className="size-4" /> Aprovar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
