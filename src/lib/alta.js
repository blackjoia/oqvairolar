// Sinais de movimento de um evento, calculados pelo robô (scripts/contagens.mjs).
// Bombando: muita gente marcou "Eu vou" ou abriu o evento nas últimas 24 horas.
export const BOMBANDO_VAO24 = 3
export const BOMBANDO_ACESSOS24 = 25
export const bombando = (e) => (e.vao24 || 0) >= BOMBANDO_VAO24 || (e.acessos24 || 0) >= BOMBANDO_ACESSOS24

// Em alta na semana: "Eu vou" pesa mais que só abrir o evento.
export const pontos = (e) => (e.vao || 0) * 10 + (e.acessos7 || 0)
