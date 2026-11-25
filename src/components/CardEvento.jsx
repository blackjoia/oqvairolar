import { Link } from 'react-router-dom'
import { MapPin, PartyPopper, Check } from 'lucide-react'
import { useMinhaPresencaNaLista, alternarEuVou, ajusteVao } from '../lib/presenca'
import { exigirConta } from '../lib/conta'
import { avisar } from './Aviso'
import Cartaz from './Cartaz'
import { diaMes, mesCurto, hora, horaDe, rotuloDia, situacao } from '../lib/datas'
import { km, textoDistancia, useMinhaPosicao } from '../lib/distancia'
import { useAuth } from '../lib/auth'
import { bombando } from '../lib/alta'
import Rostos, { textoQuemVai, veRostos } from './Rostos'
import Bombando from './Bombando'

// soHora: a lista já está agrupada por dia, então o card mostra só a hora.
// grande: destaque do próximo evento, ocupa a largura toda com o cartaz em paisagem.
export default function CardEvento({ evento: e, soHora = false, grande = false, className = '', style }) {
  const temImagem = !!e.cartazUrl
  const pos = useMinhaPosicao()
  const dist = textoDistancia(km(pos, e))
  const preco = e.gratuito ? 'Grátis' : e.preco
  const agora = situacao(e)?.tipo === 'agora'
  const { user } = useAuth() || {}
  // Rostos só para quem entrou com a conta (o mesmo combinado da página do evento); sem conta, só o número.
  const rostos = veRostos(user) ? (e.rostos || []) : []
  const minha = useMinhaPresencaNaLista(e.id, user?.uid)
  // O número do card vem do robô (a cada 10 min); soma a marcação feita agora para a pessoa ver na hora.
  const vaoTela = Math.max(0, (e.vao || 0) + ajusteVao(e.id))
  const quemVai = textoQuemVai({ ...e, vao: vaoTela }, rostos.length > 0)
  const passou = situacao(e)?.tipo === 'passou'
  const euVou = async (x) => {
    x.preventDefault(); x.stopPropagation()
    // "Eu vou" só com conta: sem conta, abre o login do Google e marca em seguida.
    try { if (await exigirConta()) { const r = await alternarEuVou(e.id); if (r.novo === 'vou') avisar('Marcado! Está nos seus rolês.') } }
    catch (err) { avisar(err.message) }
  }
  return (
    <Link to={`/evento/${e.id}`} style={style}
      className={`card-evento group flex overflow-hidden rounded-2xl border border-line bg-surface hover:border-brand/40 ${grande ? 'col-span-2 flex-col sm:flex-row md:col-span-3' : 'flex-col'} ${className}`}>
      <div className={`relative overflow-hidden ${grande ? 'aspect-[16/9] sm:aspect-auto sm:w-3/5' : 'aspect-[4/5]'}`}>
        <Cartaz evento={e} comData={!temImagem} marca={grande} largo={grande} className="card-img absolute inset-0 size-full" />
        {temImagem && (
          <div className="absolute left-2 top-2 rounded-lg bg-accent px-2 py-1 text-center leading-none text-on-accent shadow">
            <div className="font-display text-xl">{diaMes(e.inicio)}</div>
            <div className="text-xs font-bold uppercase">{mesCurto(e.inicio)}</div>
          </div>
        )}
        {e.destaque && !agora && <span className={`absolute right-2 ${e.gratuito ? 'top-9' : 'top-2'} rounded-full bg-brand px-2 py-0.5 text-xs font-extrabold text-on-brand shadow ring-2 ring-accent`}>★ DESTAQUE</span>}
        {agora && <span className={`absolute right-2 ${e.gratuito ? 'top-9' : 'top-2'} inline-flex items-center gap-1.5 rounded-full bg-[#1a1630]/90 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow`}><span className="ao-vivo size-2 rounded-full bg-accent" aria-hidden />Rolando agora</span>}
        {e.gratuito && <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-on-accent shadow">GRÁTIS</span>}
      </div>
      <div className={`flex flex-1 flex-col ${grande ? 'p-4 sm:p-6' : 'p-3'}`}>
        {grande && !agora && <p className="text-xs font-bold uppercase tracking-widest text-muted">Próximo rolê</p>}
        {bombando(e) && !agora && <Bombando className="mb-1 w-fit" />}
        <div className={`num font-bold uppercase tracking-wide text-brand-ink ${grande ? 'text-sm' : 'text-xs'}`}>{soHora ? horaDe(e) : `${rotuloDia(e.inicio)} · ${horaDe(e)}`}</div>
        <h3 className={`mt-0.5 font-display uppercase leading-tight tracking-wide group-hover:text-brand-ink ${grande ? 'text-2xl sm:text-4xl' : 'line-clamp-2 text-lg'} ${temImagem ? '' : 'sr-only'}`}>{e.titulo}</h3>
        <p className="mt-1 flex items-start gap-1 text-xs text-muted">
          <MapPin className="mt-px size-3.5 shrink-0 text-brand-ink" aria-hidden />
          <span className="line-clamp-2">{[e.localNome, e.cidade].filter(Boolean).join(' · ')}</span>
        </p>
        {dist && <p className="mt-1 w-fit rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand-ink">{dist} de você</p>}
        {quemVai && (
          <p className="num mt-1.5 flex items-center gap-1.5 text-xs font-bold text-ink">
            {rostos.length > 0 && <Rostos lista={rostos} />}
            <span className="line-clamp-1">{quemVai}</span>
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {preco ? <p className="num min-w-0 truncate text-sm font-bold">{preco}</p> : <span />}
          {!passou && (
            <button type="button" onClick={euVou} aria-pressed={minha === 'vou'} aria-label={minha === 'vou' ? `Você vai em ${e.titulo}. Tocar para desmarcar` : `Eu vou em ${e.titulo}`}
              className={`eu-vou-card inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-extrabold ${minha === 'vou' ? 'bg-accent text-on-accent' : 'border border-line bg-surface text-ink hover:border-brand hover:text-brand-ink'}`}>
              {minha === 'vou' ? <Check className="size-4" aria-hidden /> : <PartyPopper className="size-4" aria-hidden />}
              {minha === 'vou' ? 'Vou' : 'Eu vou'}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
