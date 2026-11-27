import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore/lite'
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
      // Onde a pessoa vai só aparece para os amigos (e para ela mesma).
      if (!ve || !(amigo || eu)) { setEventos(null); return }
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
            <p className="mt-1 text-sm text-muted">Só os amigos veem o perfil e os rolês.</p>
            <BotaoAmizade uid={uid} nome={nomeFechado} className="mt-4 flex justify-center" />
          </section>
        )}
        {u && (<>
          <section className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              {u.foto ? <img src={u.foto} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded-full bg-surface-2 text-xl font-bold">{u.nome?.[0]}</span>}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold leading-tight">{u.nome}</h1>
                {(amigo || eu) && <p className="text-sm text-muted">{eventos ? (eventos.length === 1 ? '1 rolê marcado' : `${eventos.length} rolês marcados`) : '\u00a0'}</p>}
              </div>
            </div>
            <BotaoAmizade uid={uid} nome={u.nome} className="mt-3" />
          </section>
          {!(amigo || eu) ? (
            <p className="mt-6 flex items-start gap-2 rounded-2xl border border-dashed border-line p-4 text-sm text-muted"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Os rolês de {u.nome.split(' ')[0]} só aparecem para os amigos.</p>
          ) : (<>
          <h2 className="mt-8 font-display text-2xl uppercase">Próximos rolês</h2>
          {!eventos ? <div className="esqueleto mt-3 h-32 rounded-2xl" />
            : eventos.length ? <div className="mt-3 grid grid-cols-2 gap-3 min-[540px]:grid-cols-3 md:grid-cols-4">{eventos.map((e) => <CardEvento key={e.id} evento={e} />)}</div>
            : <p className="mt-2 text-muted">Nenhum evento marcado por enquanto.</p>}
          </>)}
        </>)}
      </main><Rodape /></>
  )
}
