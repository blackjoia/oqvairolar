// Service worker do O Que Vai Rolar: permite instalar o site como app no celular.
// Não guarda páginas em cache (o site está sempre atualizado); só mostra uma tela simples sem internet.
const CACHE = 'oqvr-offline-v1'
const OFFLINE = '/offline.html'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Limpa caches antigos (inclusive os do site velho)
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)))
})
