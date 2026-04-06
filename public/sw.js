const APP_CACHE = 'elbar-app-cache-v1'
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== APP_CACHE).map((key) => caches.delete(key))),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = networkResponse.clone()
            caches.open(APP_CACHE).then((cache) => cache.put(event.request, clone))
          }

          return networkResponse
        })
        .catch(() => caches.match('/index.html'))
    }),
  )
})
