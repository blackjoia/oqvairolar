import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { enviarCartaz, uploadAtivo } from '../lib/upload'

// Campo de cartaz: envia a foto (se o Cloudinary estiver configurado) ou aceita um link.
export default function CampoCartaz({ valor, onChange }) {
  const input = useRef(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const escolher = async (ev) => {
    const f = ev.target.files?.[0]; if (!f) return
    if (!f.type.startsWith('image/')) return setErro('Escolha uma imagem (JPG ou PNG).')
    setErro(''); setEnviando(true)
    try { onChange(await enviarCartaz(f)) } catch (e) { setErro(e.message) }
    setEnviando(false); ev.target.value = ''
  }

  return (
    <div className="space-y-2">
      {valor ? (
        <div className="relative w-40">
          <img src={valor} alt="Cartaz" className="aspect-[4/5] w-40 rounded-xl border border-line object-cover" />
          <button type="button" onClick={() => onChange('')} aria-label="Tirar cartaz"
            className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-danger text-white shadow"><X className="size-4" /></button>
        </div>
      ) : uploadAtivo && (
        <button type="button" onClick={() => input.current?.click()} disabled={enviando}
          className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-line bg-surface-2 p-6 text-muted hover:border-brand hover:text-brand-ink">
          {enviando ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
          <span className="font-semibold">{enviando ? 'Enviando…' : 'Enviar foto do cartaz'}</span>
          <span className="text-xs">JPG ou PNG, do celular ou do computador</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={escolher} />
      {!valor && (
        <label className="block"><span className="rotulo">{uploadAtivo ? 'Ou cole o link da imagem' : 'Link da imagem do cartaz'}</span>
          <input className="campo" type="url" inputMode="url" placeholder="https://…"
            onChange={(e) => onChange(e.target.value.trim())} /></label>
      )}
      {erro && <p className="text-sm font-semibold text-danger">{erro}</p>}
    </div>
  )
}
