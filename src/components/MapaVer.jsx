import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Mapas no estilo do site: claro no tema claro, escuro no tema escuro (CARTO, grátis).
export const urlTiles = () => document.documentElement.classList.contains('dark')
  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
export const ATRIB = '&copy; OpenStreetMap &copy; CARTO'

export const pinoIcone = () => L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#6d28ff;border:3px solid #c6ff00;box-shadow:0 2px 8px rgba(0,0,0,.45)"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

// Troca as imagens do mapa quando o tema muda.
export function seguirTema(mapa) {
  const camada = L.tileLayer(urlTiles(), { maxZoom: 20, attribution: ATRIB, subdomains: 'abcd' }).addTo(mapa)
  const trocar = () => camada.setUrl(urlTiles())
  window.addEventListener('tema', trocar)
  return () => window.removeEventListener('tema', trocar)
}

export default function MapaVer({ lat, lng, className = '' }) {
  const div = useRef(null)
  useEffect(() => {
    const m = L.map(div.current, { scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView([lat, lng], 16)
    const parar = seguirTema(m)
    L.marker([lat, lng], { icon: pinoIcone(), keyboard: false }).addTo(m)
    return () => { parar(); m.remove() }
  }, [lat, lng])
  return <div ref={div} className={`z-0 overflow-hidden rounded-2xl border border-line ${className}`} />
}
