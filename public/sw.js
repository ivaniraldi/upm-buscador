const CACHE_NAME = "buscador-estandares-v1"
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/_next/static/css/app/layout.css",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/pages/_app.js",
]

// Instalar el service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache abierto")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Interceptar las peticiones de red
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Devolver el recurso desde cache si está disponible
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        // Verificar si recibimos una respuesta válida
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clonar la respuesta
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})

// Activar el service worker y limpiar caches antiguos
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Manejar mensajes del cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Notificaciones push (para futuras implementaciones)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nueva actualización disponible",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver",
        icon: "/icon-192.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icon-192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Buscador de Estándares", options))
})

// Manejar clics en notificaciones
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
