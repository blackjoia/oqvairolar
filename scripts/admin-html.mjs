// Gera dist/admin.html: a mesma página do site, mas já carregando o manifesto do painel.
// Assim o celular reconhece o painel como um app separado do app da agenda.
import { readFileSync, writeFileSync } from 'node:fs'
const dist = new URL('../dist/', import.meta.url)
const html = readFileSync(new URL('index.html', dist), 'utf8')
  .replace('href="/manifest.webmanifest"', 'href="/admin.webmanifest"')
  .replace(/<meta name="theme-color" content="[^"]*"/, '<meta name="theme-color" content="#1a1630"')
  .replace(/(<link rel="apple-touch-icon"[^>]*href=")[^"]*"/, '$1/icons/admin-192.png"')
  .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*"/, '$1Admin OQVR"')
writeFileSync(new URL('admin.html', dist), html)
console.log('admin.html gerado')
