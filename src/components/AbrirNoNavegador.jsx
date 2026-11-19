import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, ExternalLink, EllipsisVertical } from 'lucide-react'
import { clique } from '../lib/visitas'

// Quem abre o site pelo navegador interno das redes sociais (Instagram, Facebook, TikTok...)
// não consegue entrar com o Google, instalar o app nem receber avisos. Este aviso leva a pessoa para o Chrome/Safari.
const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)
export const navegadorDeRede = () => /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Messenger|musical_ly|BytedanceWebview|TikTok|Barcelona|LinkedInApp|Snapchat|Pinterest|Line\//i.test(ua())
const ehIOS = () => /iPhone|iPad|iPod/i.test(ua())
const ehAndroid = () => /Android/i.test(ua())
const CHAVE = 'abrirNavegadorFechado'

function linkExterno() {
  const { host, pathname, search, hash, href } = window.location
  if (ehAndroid()) return `intent://${host}${pathname}${search}${hash}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(href)};end`
  if (ehIOS()) return `x-safari-https://${host}${pathname}${search}${hash}`
  return href
}

export default function AbrirNoNavegador() {
  const { pathname } = useLocation()
  const [fechado, setFechado] = useState(() => { try { return sessionStorage.getItem(CHAVE) === '1' } catch { return false } })
  if (fechado || !navegadorDeRede() || pathname.startsWith('/admin')) return null
  const fechar = () => { setFechado(true); try { sessionStorage.setItem(CHAVE, '1') } catch {} }
  const nome = ehIOS() ? 'Safari' : 'Chrome'
  return (
    <div className="sticky top-0 z-[60] bg-brand text-on-brand" role="region" aria-label={`Abrir no ${nome}`}>
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1 text-sm leading-snug">
          <p className="font-bold">Abra no {nome} para usar tudo</p>
          <p className="text-white/75">
            Aqui dentro não dá para entrar com o Google nem instalar o app.
            {ehIOS() && <> Se o botão não abrir, toque em <EllipsisVertical className="inline size-3.5 rotate-90" aria-label="menu" /> e em <b>Abrir no navegador</b>.</>}
          </p>
        </div>
        <a href={linkExterno()} onClick={() => clique('abrir-navegador')} className="btn-accent shrink-0 px-3 py-2 text-sm">
          <ExternalLink className="size-4" aria-hidden /> Abrir no {nome}
        </a>
        <button onClick={fechar} aria-label="Fechar aviso" className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10"><X className="size-5" /></button>
      </div>
    </div>
  )
}
