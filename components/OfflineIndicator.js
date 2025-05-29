"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wifi, WifiOff } from "lucide-react"
import toast from "react-hot-toast"

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return

    // Verificar estado inicial
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      toast.success("Conexión restaurada", {
        icon: "🌐",
        duration: 3000,
      })

      // Ocultar indicador después de 3 segundos
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
      toast.error("Sin conexión a internet", {
        icon: "📡",
        duration: 5000,
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [mounted])

  // Don't render until mounted
  if (!mounted) return null

  // Mostrar siempre cuando está offline, o temporalmente cuando vuelve online
  const shouldShow = !isOnline || showIndicator

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
              isOnline ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi size={16} />
                <span>Conectado</span>
              </>
            ) : (
              <>
                <WifiOff size={16} />
                <span>Sin conexión</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
