import { useEffect, useState } from 'react'
import { addDoc, collection, getCountFromServer, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Send } from 'lucide-react'

// Painel: mandar um aviso (push) para todo mundo que ativou os avisos no app.
// O robô do site envia em até 10 minutos.
export default function Avisos() {
  const [f, setF] = useState({ titulo: '', corpo: '', url: '/' })
  const [inscritos, setInscritos] = useState(null)
  const [lista, setLista] = useState([])
  const [estado, setEstado] = useState('')
  const carregar = () => {
    getCountFromServer(collection(db, 'inscritos')).then((s) => setInscritos(s.data().count)).catch(() => setInscritos(null))
    getDocs(query(collection(db, 'avisosGerais'), orderBy('criadoEm', 'desc'), limit(10))).then((s) => setLista(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {})
  }
  useEffect(carregar, [])
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const enviar = async (e) => {
    e.preventDefault()
    if (!f.titulo.trim()) return
    setEstado('enviando')
    try {
      await addDoc(collection(db, 'avisosGerais'), { titulo: f.titulo.trim().slice(0, 80), corpo: f.corpo.trim().slice(0, 200), url: (f.url.trim() || '/').slice(0, 200), criadoEm: serverTimestamp(), enviado: false })
      setF({ titulo: '', corpo: '', url: '/' }); setEstado('ok'); carregar()
    } catch (x) { setEstado(x.message) }
  }
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="font-display text-3xl uppercase">Avisos no celular</h2>
      <p className="mt-1 text-sm text-muted">{inscritos == null ? 'Contando quem ativou…' : `${inscritos.toLocaleString('pt-BR')} aparelho(s) com avisos ativos.`} O aviso sai em até 10 minutos.</p>
      <form onSubmit={enviar} className="mt-4 grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="grid gap-1 font-semibold">Título *<input className="campo" maxLength={80} value={f.titulo} onChange={set('titulo')} placeholder="Saiu a agenda do fim de semana! 🎉" /></label>
        <label className="grid gap-1 font-semibold">Texto<textarea className="campo min-h-20" maxLength={200} value={f.corpo} onChange={set('corpo')} placeholder="Festa na Vila, Veto e Zico Rubas e muito mais em Beltrão e Pato Branco." /></label>
        <label className="grid gap-1 font-semibold">Abrir qual página<input className="campo" maxLength={200} value={f.url} onChange={set('url')} placeholder="/ ou /semana ou /evento/..." /></label>
        {estado && estado !== 'enviando' && <p className={estado === 'ok' ? 'font-semibold text-brand-ink' : 'font-semibold text-danger'}>{estado === 'ok' ? 'Aviso na fila. Sai em até 10 minutos.' : estado}</p>}
        <button disabled={estado === 'enviando' || !f.titulo.trim()} className="btn-brand h-12"><Send className="size-4" aria-hidden /> {estado === 'enviando' ? 'Enviando…' : 'Enviar para todos'}</button>
      </form>
      {lista.length > 0 && <div className="mt-6">
        <h3 className="font-bold">Últimos avisos</h3>
        <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
          {lista.map((a) => <li key={a.id} className="p-3 text-sm"><b>{a.titulo}</b>{a.corpo && <span className="text-muted"> · {a.corpo}</span>}<br />
            <span className="text-muted">{a.enviado ? `Enviado para ${a.entregues ?? 0} aparelho(s)` : 'Na fila'}</span></li>)}
        </ul>
      </div>}
    </div>
  )
}
