// Busca de locais. Com a chave do Google (VITE_GOOGLE_MAPS_KEY) usa o Google Places;
// sem chave, usa o Photon (OpenStreetMap), que é grátis mas conhece menos lugares.
const CHAVE = import.meta.env.VITE_GOOGLE_MAPS_KEY
export const usaGoogle = !!CHAVE

let carregando
function carregarGoogle() {
  if (window.google?.maps?.importLibrary) return Promise.resolve()
  if (carregando) return carregando
  carregando = new Promise((ok, erro) => {
    window.__oqvGoogleOk = ok
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${CHAVE}&v=weekly&loading=async&language=pt-BR&region=BR&callback=__oqvGoogleOk`
    s.async = true
    s.onerror = erro
    document.head.appendChild(s)
  })
  return carregando
}

let sessao
async function googleBuscar(texto, [lat, lng]) {
  await carregarGoogle()
  const { AutocompleteSuggestion, AutocompleteSessionToken } = await google.maps.importLibrary('places')
  sessao = sessao || new AutocompleteSessionToken()
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: texto,
    sessionToken: sessao,
    includedRegionCodes: ['br'],
    language: 'pt-BR',
    locationBias: { center: { lat, lng }, radius: 50000 },
  })
  return suggestions.filter((s) => s.placePrediction).map((s) => {
    const p = s.placePrediction
    return {
      nome: p.mainText?.toString() || p.text.toString(),
      endereco: p.secondaryText?.toString() || '',
      cidade: '',
      _google: p,
    }
  })
}

async function googleDetalhar(item) {
  const place = item._google.toPlace()
  await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] })
  sessao = null // a sessão termina quando um lugar é escolhido
  const comp = (tipo) => place.addressComponents?.find((c) => c.types.includes(tipo))?.longText || ''
  const rua = [comp('route'), comp('street_number')].filter(Boolean).join(', ')
  return {
    nome: place.displayName || item.nome,
    endereco: [rua, comp('sublocality_level_1') || comp('sublocality')].filter(Boolean).join(' · ') || place.formattedAddress || '',
    cidade: comp('administrative_area_level_2') || comp('locality'),
    lat: place.location.lat(),
    lng: place.location.lng(),
  }
}

async function photonBuscar(texto, [lat, lon]) {
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

export const buscarLugares = (texto, perto) => (usaGoogle ? googleBuscar : photonBuscar)(texto, perto)

// Completa o item escolhido com coordenadas (o Google só manda depois de escolher).
export const detalharLugar = (item) => (item._google ? googleDetalhar(item) : Promise.resolve(item))
