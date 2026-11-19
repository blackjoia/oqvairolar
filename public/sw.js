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

// Lembretes de evento (push). A mensagem chega com { data: { titulo, corpo, url, imagem } }.
self.addEventListener('push', (event) => {
  let p = {}
  try { p = event.data ? event.data.json() : {} } catch { p = { data: { corpo: event.data?.text() } } }
  const d = { ...(p.notification || {}), ...(p.data || {}) }
  const titulo = d.titulo || d.title || 'O Que Vai Rolar'
  event.waitUntil(self.registration.showNotification(titulo, {
    body: d.corpo || d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    image: d.imagem || undefined,
    tag: d.tag || undefined,
    data: { url: d.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of abertas) { if (c.url === url && 'focus' in c) return c.focus() }
    return self.clients.openWindow(url)
  })())
})
