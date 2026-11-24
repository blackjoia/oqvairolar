import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Topo from '../components/Topo'
import CardEvento from '../components/CardEvento'
import { Rodape } from './Inicio'
import { buscarUsuario } from '../lib/social'
import { buscarEvento } from '../lib/eventos'
import { ArrowLeft, Lock } from 'lucide-react'
import BotaoAmizade from '../components/BotaoAmizade'
import { useAuth } from '../lib/auth'
import { useAmigos } from '../lib/amigos-ctx'

// Perfil de quem tem conta: aberto para todos se a pessoa ligou "Aparecer em quem vai";
// para os amigos, sempre. É também o link de convite de amizade (/u/:uid?o=convite-amigo).
export default function Usuario() {
  const { uid } = useParams()
  const [u, setU] = useState(undefined)
  const [nomeFechado, setNomeFechado] = useState('')
  const [eventos, setEventos] = useState(null)
  const { usuario } = useAuth()
  const { amigos } = useAmigos()
  const amigo = amigos.includes(uid)
  const eu = usuario?.uid === uid
  useEffect(() => {
    setU(undefined); setEventos(null)
    buscarUsuario(uid).then(async (x) => {
      const ve = x && (x.publico || amigo || eu)
      setU(ve ? x : null); setNomeFechado(x?.nome || '')
      if (!ve) return
      const snap = await getDocs(query(collection(db, 'presencas'), where('uid', '==', uid), where('tipo', '==', 'vou'))).catch(() => null)
      const evs = await Promise.all((snap?.docs || []).map((d) => buscarEvento(d.data().eventoId).catch(() => null)))
      setEventos(evs.filter((e) => e && (e.fim || e.inicio).getTime() > Date.now() - 6 * 3600000).sort((a, b) => a.inicio - b.inicio))
    })
  }, [uid, amigo, eu])
  return (
    <><Topo />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-20 pt-4">
        <Link to="/" className="link-toque -my-2 gap-1 text-sm font-semibold text-brand-ink"><ArrowLeft className="size-4" aria-hidden /> Agenda</Link>
        {u === undefined && <div className="esqueleto mt-6 h-32 rounded-2xl" />}
        {u === null && (
          <section className="mx-auto mt-10 max-w-sm text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-surface-2 text-muted"><Lock className="size-7" aria-hidden /></span>
            <p className="mt-4 font-semibold">{nomeFechado ? `${nomeFechado.split(' ')[0]} tem o perfil fechado` : 'Perfil fechado'}</p>
            <p className="mt-1 text-sm text-muted">Só os amigos veem os rolês dessa pessoa.</p>
            <BotaoAmizade uid={uid} nome={nomeFechado} className="mt-4 flex justify-center" />
          </section>
        )}
        {u && (<>
          <section className="mt-5 flex items-center gap-4">
            {u.foto ? <img src={u.foto} alt="" referrerPolicy="no-referrer" className="size-20 rounded-3xl object-cover" /> : <span className="grid size-20 place-items-center rounded-3xl bg-surface-2 font-display text-4xl">{u.nome?.[0]}</span>}
            <div><p className="text-sm font-bold uppercase tracking-widest text-brand-ink">Vai rolar com</p>
              <h1 className="font-display text-5xl uppercase leading-none">{u.nome.split(' ')[0]}</h1></div>
          </section>
          <BotaoAmizade uid={uid} nome={u.nome} className="mt-4" />
          <h2 className="mt-8 font-display text-2xl uppercase">Vai em</h2>
          {!eventos ? <div className="esqueleto mt-3 h-32 rounded-2xl" />
            : eventos.length ? <div className="mt-3 grid grid-cols-2 gap-3 min-[540px]:grid-cols-3 md:grid-cols-4">{eventos.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
            : <p className="mt-2 text-muted">Nenhum evento marcado por enquanto.</p>}
        </>)}
      </main><Rodape /></>
  )
}
