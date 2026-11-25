// Ações que pedem conta (ex.: "Eu vou"). Garante que a pessoa entrou com o Google antes de seguir.
import { auth } from './firebase'
import { navegadorDeRede } from '../components/AbrirNoNavegador'

export const temConta = () => { const u = auth.currentUser; return !!u && u.providerData.some((p) => p.providerId === 'google.com') }

// Devolve true quando a pessoa está entrada; false se ela fechou a janela do Google.
export async function exigirConta() {
  if (temConta()) return true
  if (navegadorDeRede()) throw new Error('Para marcar, abra o site no Chrome ou Safari e entre com o Google.')
  const { entrarComGoogle } = await import('./auth')
  const r = await entrarComGoogle()
  return !!r && temConta()
}
