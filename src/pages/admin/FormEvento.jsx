import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Cartaz from '../../components/Cartaz'
import MapaEditor from '../../components/MapaEditor'
import { buscarEvento, criarEvento, salvarEvento } from '../../lib/eventos'
import { paraInputLocal } from '../../lib/datas'
import { CATEGORIAS, GENEROS, CIDADES } from '../../lib/constantes'

const VAZIO = {
  titulo: '', categoria: 'musica', generos: [], inicio: null, fim: null,
  localNome: '', endereco: '', cidade: 'Francisco Beltrão', lat: null, lng: null,
  descricao: '', cartazUrl: '', ingressoUrl: '', gratuito: false, preco: '',
  instagram: '', status: 'publicado', origem: 'admin',
}

export default function FormEvento() {
  const { id } = useParams()
  const novo = !id || id === 'novo'
  const nav = useNavigate()
  const [e, setE] = useState(novo ? VAZIO : null)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [generoExtra, setGeneroExtra] = useState('')

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
  if (e === false) return <p>Evento não encontrado. <Link className="text-brand" to="/admin">Voltar</Link></p>

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
      nav('/admin')
    } catch (err) { setMsg('Erro ao salvar: ' + err.message); setSalvando(false) }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={(ev) => { ev.preventDefault(); salvar('publicado') }} className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase">{novo ? 'Novo evento' : 'Editar evento'}</h1>
          <Link to="/admin" className="text-sm font-semibold text-muted">Cancelar</Link>
        </div>

        <Bloco titulo="O quê">
          <label className="block"><span className="rotulo">Nome do evento *</span>
            <input className="campo" value={e.titulo} onChange={set('titulo')} placeholder="Ex.: Noite do Rock com Banda X" /></label>
          <div>
            <span className="rotulo">Tipo</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <button type="button" key={c.id} onClick={() => setE((x) => ({ ...x, categoria: c.id }))}
                  className={`chip ${e.categoria === c.id ? 'chip-on' : ''}`}>{c.emoji} {c.nome}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="rotulo">Gêneros / estilos</span>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...GENEROS, ...e.generos])].map((g) => (
                <button type="button" key={g} onClick={() => alternarGenero(g)}
                  className={`chip py-1 text-xs ${e.generos.includes(g) ? 'chip-on' : ''}`}>{g}</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="campo" placeholder="Outro estilo" value={generoExtra} onChange={(x) => setGeneroExtra(x.target.value)}
                onKeyDown={(x) => { if (x.key === 'Enter') { x.preventDefault(); addGenero() } }} />
              <button type="button" onClick={addGenero} className="btn-ghost">Adicionar</button>
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

        <Bloco titulo="Cartaz">
          <label className="block"><span className="rotulo">Link da imagem do cartaz</span>
            <input className="campo" type="url" value={e.cartazUrl} onChange={set('cartazUrl')} placeholder="https://…/cartaz.jpg" /></label>
          <p className="text-sm text-muted">Por enquanto é por link. O envio direto da foto entra na próxima etapa.</p>
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
      <legend className="px-1 font-display text-lg uppercase tracking-wide text-brand">{titulo}</legend>
      {children}
    </fieldset>
  )
}
