import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ChevronDown, Send } from 'lucide-react'
import Topo from '../components/Topo'
import { Rodape } from './Inicio'
import CampoCartaz from '../components/CampoCartaz'
import MapaEditor from '../components/MapaEditor'
import { enviarParaAprovacao } from '../lib/eventos'
import { paraInputLocal } from '../lib/datas'
import { CATEGORIAS, GENEROS, CIDADES } from '../lib/constantes'

const VAZIO = {
  titulo: '', categoria: 'musica', generos: [], inicio: null, fim: null,
  localNome: '', endereco: '', cidade: 'Francisco Beltrão', lat: null, lng: null,
  descricao: '', cartazUrl: '', ingressoUrl: '', gratuito: false, preco: '', instagram: '',
  quemNome: '', quemContato: '', site: '',
}

export default function Divulgar() {
  const [e, setE] = useState(VAZIO)
  const [mais, setMais] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  const set = (k) => (ev) => setE((x) => ({ ...x, [k]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value }))
  const setData = (k) => (ev) => setE((x) => ({ ...x, [k]: ev.target.value ? new Date(ev.target.value) : null }))
  const mudarPonto = useCallback((p) => setE((x) => ({ ...x, lat: p.lat, lng: p.lng })), [])
  const escolherLugar = useCallback((l) => setE((x) => ({ ...x, localNome: x.localNome || l.nome || '', endereco: x.endereco || l.endereco || '', cidade: l.cidade || x.cidade })), [])
  const alternarGenero = (g) => setE((x) => ({ ...x, generos: x.generos.includes(g) ? x.generos.filter((y) => y !== g) : [...x.generos, g] }))

  const enviar = async (ev) => {
    ev.preventDefault(); setMsg('')
    if (e.site) return setOk(true) // robô preencheu o campo escondido
    if (!e.titulo.trim()) return setMsg('Coloque o nome do evento.')
    if (!e.inicio) return setMsg('Coloque a data e a hora.')
    if (e.inicio < new Date(Date.now() - 3600000)) return setMsg('Essa data já passou.')
    if (!e.localNome.trim()) return setMsg('Coloque o nome do local.')
    if (!e.quemNome.trim() || !e.quemContato.trim()) return setMsg('Coloque seu nome e um contato, para a gente tirar dúvidas.')
    try { const ultimo = Number(localStorage.getItem('ultimoEnvio') || 0); if (Date.now() - ultimo < 60000) return setMsg('Espere um minutinho antes de enviar outro evento.') } catch {}
    setEnviando(true)
    try {
      await enviarParaAprovacao({
        ...e,
        titulo: e.titulo.trim().slice(0, 120),
        descricao: e.descricao.trim().slice(0, 2000),
        instagram: e.instagram.trim().replace(/^@/, '').slice(0, 60),
        preco: e.gratuito ? '' : e.preco.trim().slice(0, 80),
        lat: e.lat == null ? null : Number(e.lat), lng: e.lng == null ? null : Number(e.lng),
        enviadoPor: { nome: e.quemNome.trim().slice(0, 80), contato: e.quemContato.trim().slice(0, 120) },
      })
      try { localStorage.setItem('ultimoEnvio', String(Date.now())) } catch {}
      setOk(true); window.scrollTo(0, 0)
    } catch (err) { console.error(err); setMsg('Não deu para enviar agora. Confira os campos e tente de novo.') }
    setEnviando(false)
  }

  if (ok) return (
    <><Topo semDivulgar />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto size-14 text-brand" />
        <h1 className="mt-3 font-display text-4xl uppercase">Recebido!</h1>
        <p className="mt-2 text-muted">Vamos conferir as informações e, assim que aprovado, o evento aparece na agenda.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { setE(VAZIO); setOk(false) }} className="btn-ghost">Enviar outro</button>
          <Link to="/" className="btn-brand">Ver a agenda</Link>
        </div>
      </main></>
  )

  return (
    <>
      <Topo semDivulgar />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Grátis</p>
        <h1 className="font-display text-5xl uppercase leading-none">Divulgar <span className="inline-block rounded-lg bg-accent px-2 leading-[1.05] text-on-accent">evento</span></h1>
        <p className="mt-3 text-muted">Vai ter show, festa, corrida ou qualquer rolê na região? Manda aqui. A gente confere e coloca na agenda.</p>

        <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
          <Bloco titulo="O evento">
            <label className="block"><span className="rotulo">Nome do evento *</span>
              <input className="campo" value={e.titulo} onChange={set('titulo')} maxLength={120} placeholder="Ex.: Noite do Rock com Banda X" /></label>
            <div>
              <span className="rotulo">Tipo</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => (
                  <button type="button" key={c.id} onClick={() => setE((x) => ({ ...x, categoria: c.id }))}
                    className={`chip inline-flex items-center gap-1.5 ${e.categoria === c.id ? 'chip-on' : ''}`}><c.Icone className="size-4" aria-hidden /> {c.nome}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="rotulo">Data e hora *</span>
                <input type="datetime-local" className="campo" value={paraInputLocal(e.inicio)} onChange={setData('inicio')} /></label>
              <label className="block"><span className="rotulo">Instagram do evento ou da banda</span>
                <input className="campo" value={e.instagram} onChange={set('instagram')} placeholder="@perfil" /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="rotulo">Local *</span>
                <input className="campo" value={e.localNome} onChange={set('localNome')} placeholder="Ex.: Bar do Zé" /></label>
              <label className="block"><span className="rotulo">Cidade *</span>
                <input className="campo" list="cidades-pub" value={e.cidade} onChange={set('cidade')} />
                <datalist id="cidades-pub">{CIDADES.map((c) => <option key={c} value={c} />)}</datalist></label>
            </div>
            <div><span className="rotulo">Cartaz</span><CampoCartaz valor={e.cartazUrl} onChange={(v) => setE((x) => ({ ...x, cartazUrl: v }))} /></div>
          </Bloco>

          <button type="button" onClick={() => setMais((v) => !v)} className="btn-ghost w-full">
            <ChevronDown className={`size-5 transition ${mais ? 'rotate-180' : ''}`} /> {mais ? 'Menos detalhes' : 'Adicionar mais detalhes (opcional)'}
          </button>

          {mais && (
            <Bloco titulo="Detalhes">
              <div>
                <span className="rotulo">Estilos</span>
                <div className="flex flex-wrap gap-1.5">
                  {GENEROS.map((g) => (
                    <button type="button" key={g} onClick={() => alternarGenero(g)} className={`chip py-1 text-xs ${e.generos.includes(g) ? 'chip-on' : ''}`}>{g}</button>
                  ))}
                </div>
              </div>
              <label className="block"><span className="rotulo">Descrição</span>
                <textarea className="campo min-h-24" maxLength={2000} value={e.descricao} onChange={set('descricao')} placeholder="Atrações, horários, informações importantes…" /></label>
              <label className="block"><span className="rotulo">Endereço</span>
                <input className="campo" value={e.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro" /></label>
              <MapaEditor lat={e.lat} lng={e.lng} onChange={mudarPonto} onEscolherLugar={escolherLugar} />
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={e.gratuito} onChange={set('gratuito')} /> Entrada gratuita
              </label>
              {!e.gratuito && (
                <label className="block"><span className="rotulo">Valor</span>
                  <input className="campo" value={e.preco} onChange={set('preco')} placeholder="Ex.: R$ 20 antecipado" /></label>
              )}
              <label className="block"><span className="rotulo">Link do ingresso</span>
                <input className="campo" type="url" value={e.ingressoUrl} onChange={set('ingressoUrl')} placeholder="https://…" /></label>
            </Bloco>
          )}

          <Bloco titulo="Quem está enviando">
            <p className="-mt-1 text-sm text-muted">Não aparece no site. É só para a gente tirar dúvidas, se precisar.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="rotulo">Seu nome *</span>
                <input className="campo" value={e.quemNome} onChange={set('quemNome')} autoComplete="name" /></label>
              <label className="block"><span className="rotulo">WhatsApp ou Instagram *</span>
                <input className="campo" value={e.quemContato} onChange={set('quemContato')} placeholder="(46) 9…  ou @perfil" /></label>
            </div>
            {/* Campo escondido contra robôs */}
            <input tabIndex={-1} autoComplete="off" value={e.site} onChange={set('site')} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden name="site" />
          </Bloco>

          {msg && <p className="rounded-xl bg-danger/10 p-3 font-semibold text-danger">{msg}</p>}
          <button disabled={enviando} className="btn-brand w-full py-3 text-lg"><Send className="size-5" /> {enviando ? 'Enviando…' : 'Enviar para aprovação'}</button>
        </form>
      </main>
      <Rodape />
    </>
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
