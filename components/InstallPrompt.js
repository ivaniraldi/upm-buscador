"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Smartphone } from "lucide-react"
import toast from "react-hot-toast"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return

    // Verificar si ya está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Mostrar el prompt después de un delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    // Escuchar cuando la app se instala
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      toast.success("¡App instalada correctamente!")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [mounted])

  // Don't render until mounted
  if (!mounted) return null

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        toast.success("Instalando aplicación...")
      } else {
        toast("Instalación cancelada")
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("Error installing app:", error)
      toast.error("Error al instalar la aplicación")
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // No mostrar de nuevo en esta sesión
    sessionStorage.setItem("installPromptDismissed", "true")
  }

  // No mostrar si ya está instalado o fue rechazado en esta sesión
  if (isInstalled || sessionStorage.getItem("installPromptDismissed")) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-white" size={20} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1">Instalar Aplicación</h3>
                <p className="text-sm text-gray-300 mb-3">Instala la app para acceso rápido y funcionalidad offline</p>

                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download size={16} />
                    Instalar
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
