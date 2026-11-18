import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CENTRO_PADRAO = [-26.0811, -53.0550] // Francisco Beltrão

const pino = L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#6d28ff;border:3px solid #c6ff00;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Busca locais com sugestões (Photon / OpenStreetMap, grátis e sem chave).
async function buscarLugares(texto, perto) {
  const [lat, lon] = perto || CENTRO_PADRAO
  const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(texto)}&lat=${lat}&lon=${lon}&limit=6`)
  const j = await r.json()
  return (j.features || []).map((f) => {
    const p = f.properties
    const rua = [p.street, p.housenumber].filter(Boolean).join(', ')
    return {
      nome: p.name || rua || p.city,
      endereco: [rua, p.district || p.locality].filter(Boolean).join(' · '),
      cidade: p.city || p.town || p.village || p.county || '',
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }
  })
}

// Aceita "-26.08, -53.05" ou um link do Google Maps com coordenadas.
export function lerCoordenadas(texto) {
  const t = String(texto || '')
  const m = t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    || t.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || t.match(/^\s*(-?\d+\.\d+)\s*[,;\s]\s*(-?\d+\.\d+)\s*$/)
  if (!m) return null
  const lat = Number(m[1]), lng = Number(m[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

export default function MapaEditor({ lat, lng, onChange, onEscolherLugar, dicaBusca }) {
  const div = useRef(null)
  const mapa = useRef(null)
  const marcador = useRef(null)
  const [texto, setTexto] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [colar, setColar] = useState('')

  const temPonto = lat != null && lng != null && lat !== '' && lng !== ''

  // Cria o mapa uma vez
  useEffect(() => {
    const m = L.map(div.current, { scrollWheelZoom: false }).setView(temPonto ? [lat, lng] : CENTRO_PADRAO, temPonto ? 17 : 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(m)
    m.on('click', (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }))
    mapa.current = m
    return () => m.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mantém o pino no lugar certo
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    if (!temPonto) { marcador.current?.remove(); marcador.current = null; return }
    const pos = [Number(lat), Number(lng)]
    if (!marcador.current) {
      marcador.current = L.marker(pos, { draggable: true, icon: pino }).addTo(m)
      marcador.current.on('dragend', (e) => { const p = e.target.getLatLng(); onChange({ lat: p.lat, lng: p.lng }) })
    } else {
      marcador.current.setLatLng(pos)
    }
    if (!m.getBounds().pad(-0.2).contains(pos)) m.setView(pos, Math.max(m.getZoom(), 16))
  }, [lat, lng, temPonto, onChange])

  // Sugestões enquanto digita
  useEffect(() => {
    const t = texto.trim()
    if (t.length < 3) { setSugestoes([]); return }
    const id = setTimeout(async () => {
      setBuscando(true)
      try {
        const c = mapa.current?.getCenter()
        setSugestoes(await buscarLugares(t, c ? [c.lat, c.lng] : null))
      } catch { setSugestoes([]) }
      setBuscando(false)
    }, 350)
    return () => clearTimeout(id)
  }, [texto])

  const escolher = (s) => {
    onEscolherLugar?.(s)
    onChange({ lat: s.lat, lng: s.lng })
    mapa.current?.setView([s.lat, s.lng], 17)
    setSugestoes([]); setTexto('')
    setAviso('Confira o pino. Se não estiver certinho, arraste até a porta do lugar.')
  }

  const aplicarColado = () => {
    const c = lerCoordenadas(colar)
    if (!c) { setAviso('Não achei coordenadas nisso. No Google Maps, segure o dedo no local e copie os números que aparecem (ex.: -26.0811, -53.0550).'); return }
    onChange(c); mapa.current?.setView([c.lat, c.lng], 17); setColar(''); setAviso('Pronto, pino colocado.')
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <input className="campo pl-10" value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder={dicaBusca || 'Buscar local: nome do bar, rua, praça…'} />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">🔎</span>
        {(sugestoes.length > 0 || buscando) && (
          <ul className="absolute inset-x-0 top-full z-[1000] mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-surface shadow-xl">
            {buscando && <li className="px-4 py-3 text-sm text-muted">Procurando…</li>}
            {sugestoes.map((s, i) => (
              <li key={i}>
                <button type="button" onClick={() => escolher(s)} className="block w-full px-4 py-2.5 text-left hover:bg-surface-2">
                  <span className="block font-semibold">{s.nome}</span>
                  <span className="block text-sm text-muted">{[s.endereco, s.cidade].filter(Boolean).join(' · ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative">
        <div ref={div} className="h-72 w-full overflow-hidden rounded-xl border border-line" />
        {!temPonto && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] rounded-lg bg-surface/95 p-2 text-center text-sm font-semibold shadow">
            Busque acima ou toque no mapa para marcar o local
          </div>
        )}
      </div>
      <p className="text-sm text-muted">Toque no mapa para mover o pino, ou arraste ele.</p>
      {aviso && <p className="text-sm font-semibold text-brand">{aviso}</p>}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-muted">Colar local do Google Maps</summary>
        <p className="mt-2 text-muted">No Google Maps, segure o dedo em cima do local. Copie os números que aparecem (ex.: -26.0811, -53.0550) ou o link do navegador, e cole aqui.</p>
        <div className="mt-2 flex gap-2">
          <input className="campo" value={colar} onChange={(e) => setColar(e.target.value)} placeholder="-26.0811, -53.0550" />
          <button type="button" onClick={aplicarColado} className="btn-ghost">Usar</button>
        </div>
      </details>
    </div>
  )
}
