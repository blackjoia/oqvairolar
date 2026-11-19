const TZ = 'America/Sao_Paulo'

export const toDate = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null)

const fmt = (d, opts) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...opts }).format(d)

export const diaSemana = (d) => fmt(d, { weekday: 'short' }).replace('.', '')
export const diaMes = (d) => fmt(d, { day: '2-digit' })
export const mesCurto = (d) => fmt(d, { month: 'short' }).replace('.', '')
export const hora = (d) => fmt(d, { hour: '2-digit', minute: '2-digit' })
export const dataLonga = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })
export const chaveDia = (d) => fmt(d, { year: 'numeric', month: '2-digit', day: '2-digit' }) // dd/mm/aaaa

export function inicioDoDia(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
export function addDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export function rotuloDia(d) {
  const hoje = inicioDoDia()
  const alvo = inicioDoDia(d)
  const diff = Math.round((alvo - hoje) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  const sem = fmt(d, { weekday: 'long' }).replace('-feira', '')
  return `${sem.charAt(0).toUpperCase() + sem.slice(1)} · ${fmt(d, { day: 'numeric' })} ${mesCurto(d)}`
}

// Faixas do filtro de dia
export function faixaDia(id) {
  const hoje = inicioDoDia()
  switch (id) {
    case 'hoje': return [hoje, addDias(hoje, 1)]
    case 'amanha': return [addDias(hoje, 1), addDias(hoje, 2)]
    case 'fds': {
      // Sexta, sábado e domingo. Se já é fim de semana, começa hoje.
      const dow = hoje.getDay() // 0 dom, 5 sex, 6 sáb
      const ateSegunda = dow === 0 ? 1 : 8 - dow
      const ini = dow === 0 || dow >= 5 ? hoje : addDias(hoje, 5 - dow)
      return [ini, addDias(hoje, ateSegunda)]
    }
    case 'semana': return [hoje, addDias(hoje, 7)]
    default: return [hoje, null]
  }
}

// Para <input type="datetime-local">
export function paraInputLocal(d) {
  if (!d) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// "Rolando agora", "Começa em 2h" ou "Já rolou". Sem hora de fim, conta 4 horas de evento.
export function situacao(e, agora = new Date()) {
  const ini = e.inicio, fim = e.fim || new Date(ini.getTime() + 4 * 3600000)
  if (agora >= fim) return { tipo: 'passou', texto: 'Já rolou' }
  if (agora >= ini) return { tipo: 'agora', texto: 'Rolando agora' }
  const min = Math.round((ini - agora) / 60000)
  if (min <= 60) return { tipo: 'logo', texto: `Começa em ${min} min` }
  if (min < 12 * 60) { const h = Math.floor(min / 60), m = min % 60; return { tipo: 'logo', texto: `Começa em ${h}h${m >= 5 ? String(m).padStart(2, '0') : ''}` } }
  return null
}
