// Distância do evento até a pessoa (em linha reta), usando a localização do celular.
// Só pede permissão quando a pessoa toca em "Perto de mim". Nada é enviado para o servidor.
import { useEffect, useState } from 'react'

export function km(a, b) {
  if (!a || !b || b.lat == null || b.lng == null || b.lat === '' || b.lng === '') return null
  b = { lat: Number(b.lat), lng: Number(b.lng) }
  if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return null
  const R = 6371, rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function textoDistancia(d) {
  if (d == null) return ''
  if (d < 1) return `${Math.max(50, Math.round((d * 1000) / 50) * 50)} m`
  return `${d < 10 ? d.toFixed(1).replace('.', ',') : Math.round(d)} km`
}

let atual = null
const ouvintes = new Set()
const avisar = () => ouvintes.forEach((f) => f(atual))
try { const s = JSON.parse(sessionStorage.getItem('minhaPosicao') || 'null'); if (s && Date.now() - s.t < 30 * 60000) atual = s } catch {}

function ler() {
  return new Promise((ok, erro) => navigator.geolocation.getCurrentPosition(
    (p) => { atual = { lat: p.coords.latitude, lng: p.coords.longitude, t: Date.now() }; try { sessionStorage.setItem('minhaPosicao', JSON.stringify(atual)) } catch {} avisar(); ok(atual) },
    (e) => erro(e), { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60000 }))
}

export async function pedirLocalizacao() {
  if (!('geolocation' in navigator)) throw new Error('Seu navegador não permite usar a localização.')
  try { await ler(); try { localStorage.setItem('usarLocal', '1') } catch {} }
  catch (e) { throw new Error(e?.code === 1 ? 'A localização está bloqueada. Libere nas permissões do navegador para ver a distância.' : 'Não deu para achar sua localização agora.') }
}

export function esquecerLocalizacao() {
  atual = null; try { sessionStorage.removeItem('minhaPosicao'); localStorage.removeItem('usarLocal') } catch {} avisar()
}

// Hook: posição atual (ou null). Se a pessoa já liberou antes, atualiza sozinho.
export function useMinhaPosicao() {
  const [pos, setPos] = useState(atual)
  useEffect(() => {
    ouvintes.add(setPos)
    let ligado = false; try { ligado = localStorage.getItem('usarLocal') === '1' } catch {}
    if (ligado && !atual && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((r) => { if (r.state === 'granted') ler().catch(() => {}) }).catch(() => {})
    }
    return () => ouvintes.delete(setPos)
  }, [])
  return pos
}
