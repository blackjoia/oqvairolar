import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Cartaz from '../../components/Cartaz'
import MapaEditor from '../../components/MapaEditor'
import CampoCartaz from '../../components/CampoCartaz'
import { buscarEvento, criarEvento, salvarEvento, listarTodos, apagarEvento, buscarContatos } from '../../lib/eventos'
import { acharParecidos, juntar } from '../../lib/parecidos'
import { diaSemana, diaMes, mesCurto, hora } from '../../lib/datas'
import { Copy, Star, Repeat, X } from 'lucide-react'
import { paraInputLocal } from '../../lib/datas'
import { CATEGORIAS, CIDADES, opcoesSub, rotuloSub } from '../../lib/constantes'

const VAZIO = {
  titulo: '', categoria: 'musica', generos: [], inicio: null, fim: null,
  localNome: '', endereco: '', cidade: 'Francisco Beltrão', lat: null, lng: null,
  descricao: '', cartazUrl: '', ingressoUrl: '', gratuito: false, semHora: false, preco: '',
  instagram: '', atracoes: [], destaque: false, status: 'publicado', origem: 'admin',
}

const REPETIR = [['', 'Não repete'], ['semana', 'Toda semana'], ['quinzena', 'A cada 15 dias'], ['mes', 'Todo mês']]
function proximaData(d, tipo, n) {
  if (!d) return null
  const x = new Date(d)
  if (tipo === 'semana') x.setDate(x.getDate() + 7 * n)
  else if (tipo === 'quinzena') x.setDate(x.getDate() + 14 * n)
  else if (tipo === 'mes') x.setMonth(x.getMonth() + n)
  return x
}

export default function FormEvento() {
  const { id } = useParams()
  const novo = !id || id === 'novo'
  const nav = useNavigate()
  const [e, setE] = useState(novo ? VAZIO : null)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [generoExtra, setGeneroExtra] = useState('')
  const [todos, setTodos] = useState([])
  const [repetir, setRepetir] = useState('')
  const [vezes, setVezes] = useState(4)
  const [atracaoExtra, setAtracaoExtra] = useState('')
  const [contatos, setContatos] = useState([])
  useEffect(() => { if (!novo) buscarContatos(id).then(setContatos) }, [id, novo])
  useEffect(() => { listarTodos().then(setTodos).catch(() => {}) }, [])
  const parecidos = useMemo(() => (e && e.titulo && e.inicio ? acharParecidos({ ...e, id: novo ? '' : id }, todos).slice(0, 3) : []), [e, todos, id, novo])

  const mudarPonto = useCallback((p) => setE((x) => ({ ...x, lat: p.lat, lng: p.lng })), [])
  const escolherLugar = useCallback((l) => setE((x) => ({
    ...x,
    localNome: x.localNome || l.nome || '',
    endereco: x.endereco || l.endereco || '',
    cidade: l.cidade || x.cidade,
  })), [])

  useEffect(() => {
    if (!novo) buscarEvento(id).then((ev) => setE(ev ? { ...VAZIO, ...ev } : false))
  }, [id, novo])

  if (e === null) return <p className="text-muted">Carregando…</p>
  if (e === false) return <p>Evento não encontrado. <Link className="text-brand-ink" to="/admin/eventos">Voltar</Link></p>

  const set = (k) => (ev) => setE((x) => ({ ...x, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value }))
  const setData = (k) => (ev) => setE((x) => ({ ...x, [k]: ev.target.value ? new Date(ev.target.value) : null }))
  const alternarGenero = (g) => setE((x) => ({ ...x, generos: x.generos.includes(g) ? x.generos.filter((y) => y !== g) : [...x.generos, g] }))
  const addGenero = () => {
    const g = generoExtra.trim(); if (!g) return
    if (!e.generos.includes(g)) setE((x) => ({ ...x, generos: [...x.generos, g] }))
    setGeneroExtra('')
  }

  const salvar = async (status) => {
    setMsg('')
    if (!e.titulo.trim()) return setMsg('Coloque o nome do evento.')
    if (!e.inicio) return setMsg('Coloque a data e a hora de início.')
    if (e.fim && e.fim < e.inicio) return setMsg('O fim está antes do início.')
    setSalvando(true)
    const dados = {
      ...e, status,
      titulo: e.titulo.trim(),
      instagram: e.instagram.trim().replace(/^@/, ''),
      lat: e.lat === '' || e.lat == null ? null : Number(e.lat),
      lng: e.lng === '' || e.lng == null ? null : Number(e.lng),
      preco: e.gratuito ? '' : e.preco.trim(),
    }
    try {
      if (novo) await criarEvento(dados); else await salvarEvento(id, dados)
      if (repetir) {
        const serie = dados.serie || (novo ? Math.random().toString(36).slice(2, 10) : id)
        if (!novo && !dados.serie) await salvarEvento(id, { ...dados, serie })
        for (let n = 1; n < vezes; n++) {
          const { id: _i, criadoEm: _c, atualizadoEm: _a, enviadoPor: _e, outrosEnvios: _o, ...base } = dados
          await criarEvento({ ...base, serie, inicio: proximaData(dados.inicio, repetir, n), fim: proximaData(dados.fim, repetir, n) })
        }
      }
      nav('/admin/eventos')
    } catch (err) { setMsg('Erro ao salvar: ' + err.message); setSalvando(false) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={(ev) => { ev.preventDefault(); salvar("publicado") }} className="min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase">{novo ? 'Novo evento' : 'Editar evento'}</h1>
          <Link to="/admin/eventos" className="text-sm font-semibold text-muted">Cancelar</Link>
        </div>

        {parecidos.length > 0 && (
          <div className="rounded-2xl border-2 border-accent bg-accent/15 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-bold"><Copy className="size-4" aria-hidden /> Parece que este evento já está cadastrado</p>
            <p className="mt-0.5 text-muted">Mesmo dia e nome ou local parecido. Se for o mesmo, junte os dois: o evento fica um só, com as informações e os perfis dos dois (banda e bar).</p>
            <ul className="mt-3 space-y-2">
              {parecidos.map(({ evento: p }) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2.5">
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/evento/${p.id}`} className="block truncate font-bold hover:text-brand-ink">{p.titulo}</Link>
                    <p className="truncate text-xs text-muted">{diaSemana(p.inicio)} {diaMes(p.inicio)} {mesCurto(p.inicio)} · {hora(p.inicio)} · {[p.localNome, p.cidade].filter(Boolean).join(', ')} · {p.status}</p>
                  </div>
                  <button type="button" disabled={salvando} className="btn-brand px-3 py-1.5 text-sm" onClick={async () => {
                    if (!confirm(`Juntar com "${p.titulo}"? O que estiver vazio lá é completado com os dados daqui${novo ? '' : ' e este cadastro é apagado'}.`)) return
                    setSalvando(true)
                    try {
                      await salvarEvento(p.id, juntar(p, { ...e, titulo: e.titulo.trim() }))
                      if (!novo) await apagarEvento(id)
                      nav(`/admin/evento/${p.id}`)
                    } catch (err) { setMsg('Erro ao juntar: ' + err.message); setSalvando(false) }
                  }}>Juntar com este</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(e.enviadoPor || contatos.length > 0) && (
          <div className="rounded-2xl border border-amber-400 bg-amber-400/10 p-4 text-sm">
            <p className="font-bold">Enviado pelo formulário</p>
            {[...(e.enviadoPor ? [e.enviadoPor] : []), ...contatos].map((c, i) => <p key={i}>{c.nome} · {c.contato}</p>)}
            <p className="mt-1 text-xs text-muted">Só você vê. Ao publicar, o contato sai do evento e fica guardado no painel.</p>
          </div>
        )}
        <Bloco titulo="O quê">
          <label className="block"><span className="rotulo">Nome do evento *</span>
            <input className="campo" value={e.titulo} onChange={set('titulo')} placeholder="Ex.: Noite do Rock com Banda X" /></label>
          <div>
            <span className="rotulo">Tipo</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <button type="button" key={c.id} onClick={() => setE((x) => ({ ...x, categoria: c.id }))}
                  className={`chip inline-flex items-center gap-1.5 ${e.categoria === c.id ? 'chip-on' : ''}`}><c.Icone className="size-4" aria-hidden /> {c.nome}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="rotulo">{rotuloSub(e.categoria)}</span>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...opcoesSub(e.categoria), ...e.generos])].map((g) => (
                <button type="button" key={g} onClick={() => alternarGenero(g)}
                  className={`chip py-1 text-xs ${e.generos.includes(g) ? 'chip-on' : ''}`}>{g}</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="campo" placeholder={e.categoria === 'musica' ? 'Outro estilo' : 'Outro tipo'} value={generoExtra} onChange={(x) => setGeneroExtra(x.target.value)}
                onKeyDown={(x) => { if (x.key === 'Enter') { x.preventDefault(); addGenero() } }} />
              <button type="button" onClick={addGenero} className="btn-ghost">Adicionar</button>
            </div>
          </div>
          <div>
            <span className="rotulo">Quem se apresenta ou organiza</span>
            <p className="-mt-1 mb-2 text-xs text-muted">Bandas, DJs, produtoras ou o @ do Instagram. O evento aparece na página de cada um.</p>
            <div className="flex flex-wrap gap-1.5">
              {(e.atracoes || []).map((a) => (
                <span key={a} className="chip chip-on flex items-center gap-1 py-1 text-xs">{a}
                  <button type="button" aria-label={`Tirar ${a}`} onClick={() => setE((x) => ({ ...x, atracoes: x.atracoes.filter((y) => y !== a) }))}><X className="size-3.5" /></button></span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="campo" placeholder="Ex.: Os Tralhas ou @ostralhas" value={atracaoExtra} onChange={(x) => setAtracaoExtra(x.target.value)}
                onKeyDown={(x) => { if (x.key === 'Enter') { x.preventDefault(); const v = atracaoExtra.trim(); if (v) setE((y) => ({ ...y, atracoes: [...new Set([...(y.atracoes || []), v])] })); setAtracaoExtra('') } }} />
              <button type="button" className="btn-ghost" onClick={() => { const v = atracaoExtra.trim(); if (v) setE((y) => ({ ...y, atracoes: [...new Set([...(y.atracoes || []), v])] })); setAtracaoExtra('') }}>Adicionar</button>
            </div>
          </div>
          <label className="block"><span className="rotulo">Descrição</span>
            <textarea className="campo min-h-28" value={e.descricao} onChange={set('descricao')} placeholder="Bandas, atrações, informações importantes…" /></label>
        </Bloco>

        <Bloco titulo="Quando">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="rotulo">Início *</span>
              <input type="datetime-local" className="campo" value={paraInputLocal(e.inicio)} onChange={setData('inicio')} /></label>
            <label className="block"><span className="rotulo">Fim (opcional)</span>
              <input type="datetime-local" className="campo" value={paraInputLocal(e.fim)} onChange={setData('fim')} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={!!e.semHora} onChange={set('semHora')} /> O local não divulgou o horário (o site mostra "horário a confirmar")
          </label>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="rotulo flex items-center gap-1.5"><Repeat className="size-4" aria-hidden /> Repetir</p>
            <div className="flex flex-wrap gap-1.5">
              {REPETIR.map(([v, n]) => <button type="button" key={v} onClick={() => setRepetir(v)} className={`chip py-1 text-xs ${repetir === v ? 'chip-on' : ''}`}>{n}</button>)}
            </div>
            {repetir && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span>Criar</span>
                <select className="campo w-auto py-1.5" value={vezes} onChange={(x) => setVezes(Number(x.target.value))}>
                  {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>datas{e.inicio ? `, até ${diaMes(proximaData(e.inicio, repetir, vezes - 1))} ${mesCurto(proximaData(e.inicio, repetir, vezes - 1))}` : ''}. Cada data vira um evento que você pode editar depois.</span>
              </div>
            )}
          </div>
        </Bloco>

        <Bloco titulo="Onde">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="rotulo">Nome do local</span>
              <input className="campo" value={e.localNome} onChange={set('localNome')} placeholder="Ex.: Bar do Zé" /></label>
            <label className="block"><span className="rotulo">Cidade</span>
              <input className="campo" list="cidades" value={e.cidade} onChange={set('cidade')} />
              <datalist id="cidades">{CIDADES.map((c) => <option key={c} value={c} />)}</datalist></label>
          </div>
          <label className="block"><span className="rotulo">Endereço</span>
            <input className="campo" value={e.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro" /></label>
          <MapaEditor lat={e.lat} lng={e.lng} onChange={mudarPonto} onEscolherLugar={escolherLugar} />
        </Bloco>

        <Bloco titulo="Ingresso e links">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={e.gratuito} onChange={set('gratuito')} /> Entrada gratuita
          </label>
          {!e.gratuito && (
            <label className="block"><span className="rotulo">Valor</span>
              <input className="campo" value={e.preco} onChange={set('preco')} placeholder="Ex.: R$ 20 antecipado / R$ 30 na hora" /></label>
          )}
          <label className="block"><span className="rotulo">Link para comprar ingresso</span>
            <input className="campo" type="url" value={e.ingressoUrl} onChange={set('ingressoUrl')} placeholder="https://…" /></label>
          <label className="block"><span className="rotulo">Instagram do evento, banda ou local</span>
            <input className="campo" value={e.instagram} onChange={set('instagram')} placeholder="@perfil" /></label>
        </Bloco>

        <Bloco titulo="Destaque">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 size-5 accent-[var(--brand)]" checked={!!e.destaque} onChange={set('destaque')} />
            <span><span className="flex items-center gap-1 font-semibold"><Star className="size-4 text-brand-ink" aria-hidden /> Evento em destaque</span>
              <span className="text-sm text-muted">Aparece no topo da agenda com o selo "Destaque". Use para eventos patrocinados ou especiais.</span></span>
          </label>
        </Bloco>

        <Bloco titulo="Cartaz">
          <CampoCartaz valor={e.cartazUrl} onChange={(v) => setE((x) => ({ ...x, cartazUrl: v }))} />
        </Bloco>

        {msg && <p className="rounded-xl bg-danger/10 p-3 font-semibold text-danger">{msg}</p>}
        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
          <button disabled={salvando} className="btn-brand flex-1">{salvando ? 'Salvando…' : 'Salvar e publicar'}</button>
          <button type="button" disabled={salvando} onClick={() => salvar('rascunho')} className="btn-ghost">Salvar oculto</button>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-2 text-sm font-bold uppercase text-muted">Prévia do cartaz</p>
          <Cartaz evento={e} className="aspect-[4/5] w-full rounded-2xl border border-line" />
        </div>
      </aside>
    </div>
  )
}

function Bloco({ titulo, children }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-line bg-surface p-4">
      <legend className="px-1 font-display text-lg uppercase tracking-wide text-brand-ink">{titulo}</legend>
      {children}
    </fieldset>
  )
}
