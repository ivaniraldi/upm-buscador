"use client"

import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "@/components/theme-provider"
import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/pwa"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({ children }) {
  useEffect(() => {
    // Registrar service worker
    registerServiceWorker()
  }, [])

  return (
    <body className={`${inter.className} bg-gray-950 text-white min-h-screen`}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#fff",
              border: "1px solid #374151",
            },
          }}
        />
      </ThemeProvider>
    </body>
  )
}
