// Botões "adicionar à agenda": Google Agenda e arquivo .ics (iPhone, Outlook, etc.)
const z = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const fimPadrao = (e) => e.fim || new Date(e.inicio.getTime() + 3 * 3600000)

const lugar = (e) => [e.localNome, e.endereco, e.cidade].filter(Boolean).join(', ')

export function linkGoogleAgenda(e, url) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.titulo,
    dates: `${z(e.inicio)}/${z(fimPadrao(e))}`,
    details: [e.descricao, url].filter(Boolean).join('\n\n'),
    location: lugar(e),
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export function baixarIcs(e, url) {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//O Que Vai Rolar//PT-BR', 'BEGIN:VEVENT',
    `UID:${e.id}@oquevairolar.com.br`,
    `DTSTAMP:${z(new Date())}`,
    `DTSTART:${z(e.inicio)}`,
    `DTEND:${z(fimPadrao(e))}`,
    `SUMMARY:${esc(e.titulo)}`,
    `LOCATION:${esc(lugar(e))}`,
    `DESCRIPTION:${esc([e.descricao, url].filter(Boolean).join('\n\n'))}`,
    `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  a.download = `${e.id}.ics`
  a.click()
  URL.revokeObjectURL(a.href)
}

export const linkComoChegar = (e) =>
  e.lat && e.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar(e))}`
