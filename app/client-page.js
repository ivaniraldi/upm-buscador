"use client"

import dynamic from "next/dynamic"

// Disable SSR for HomePage component
const DynamicHome = dynamic(() => import("../components/HomePage"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando aplicación...</p>
      </div>
    </div>
  ),
})

export default function ClientPage() {
  return <DynamicHome />
}
