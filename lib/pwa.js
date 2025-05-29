"use client"

// Utilidades para PWA
export const registerServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js")
      console.log("Service Worker registrado:", registration)

      // Verificar actualizaciones
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              if (confirm("Nueva versión disponible. ¿Actualizar?")) {
                newWorker.postMessage({ type: "SKIP_WAITING" })
                window.location.reload()
              }
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error("Error registrando Service Worker:", error)
    }
  }
}

// Verificar si la app está instalada
export const isAppInstalled = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
}

// Verificar soporte para PWA
export const isPWASupported = () => {
  if (typeof window === "undefined") return false
  return "serviceWorker" in navigator && "PushManager" in window
}

// Configurar notificaciones push (para futuras implementaciones)
export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }
  const permission = await Notification.requestPermission()
  return permission === "granted"
}

// Detectar si está offline
export const isOffline = () => {
  if (typeof window === "undefined") return false
  return !navigator.onLine
}

// Configurar cache de datos
export const cacheData = async (key, data) => {
  if ("caches" in window) {
    try {
      const cache = await caches.open("app-data-v1")
      const response = new Response(JSON.stringify(data))
      await cache.put(key, response)
    } catch (error) {
      console.error("Error caching data:", error)
    }
  }
}

// Recuperar datos del cache
export const getCachedData = async (key) => {
  if ("caches" in window) {
    try {
      const cache = await caches.open("app-data-v1")
      const response = await cache.match(key)
      if (response) {
        return await response.json()
      }
    } catch (error) {
      console.error("Error getting cached data:", error)
    }
  }
  return null
}

// Configurar estrategias de cache
export const setupCacheStrategies = () => {
  // Cache first para recursos estáticos
  // Network first para datos dinámicos
  // Stale while revalidate para contenido que puede estar desactualizado
}
