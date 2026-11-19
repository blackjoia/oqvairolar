import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import { Rodape } from './Inicio'
import { buscarUsuario } from '../lib/social'
import { buscarEvento } from '../lib/eventos'
import { ArrowLeft } from 'lucide-react'

// Perfil público de quem tem conta: só aparece se a pessoa ligou "Aparecer em quem vai".
export default function Usuario() {
  const { uid } = useParams()
  const [u, setU] = useState(undefined)
  const [eventos, setEventos] = useState(null)
  useEffect(() => {
    buscarUsuario(uid).then(async (x) => {
      setU(x?.publico ? x : null)
      if (!x?.publico) return
      const snap = await getDocs(query(collection(db, 'presencas'), where('uid', '==', uid), where('tipo', '==', 'vou'))).catch(() => null)
      const evs = await Promise.all((snap?.docs || []).map((d) => buscarEvento(d.data().eventoId).catch(() => null)))
      setEventos(evs.filter((e) => e && (e.fim || e.inicio).getTime() > Date.now() - 6 * 3600000).sort((a, b) => a.inicio - b.inicio))
    })
  }, [uid])
  return (
    <><Topo />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><ArrowLeft className="size-4" /> Agenda</Link>
        {u === undefined && <div className="esqueleto mt-6 h-32 rounded-2xl" />}
        {u === null && <p className="mt-10 text-center text-muted">Esse perfil não é público.</p>}
        {u && (<>
          <section className="mt-5 flex items-center gap-4">
            {u.foto ? <img src={u.foto} alt="" referrerPolicy="no-referrer" className="size-20 rounded-3xl object-cover" /> : <span className="grid size-20 place-items-center rounded-3xl bg-surface-2 font-display text-4xl">{u.nome?.[0]}</span>}
            <div><p className="text-sm font-bold uppercase tracking-widest text-brand">Vai rolar com</p>
              <h1 className="font-display text-5xl uppercase leading-none">{u.nome.split(' ')[0]}</h1></div>
          </section>
          <h2 className="mt-8 font-display text-2xl uppercase">Vai em</h2>
          {!eventos ? <div className="esqueleto mt-3 h-32 rounded-2xl" />
            : eventos.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{eventos.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
            : <p className="mt-2 text-muted">Nenhum evento marcado por enquanto.</p>}
        </>)}
      </main><Rodape /></>
  )
}
