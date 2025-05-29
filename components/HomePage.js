"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, FileText, Loader2, Home, Filter, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import PDFCard from "@/components/PDFCard"
import SearchResults from "@/components/SearchResults"
import ChatBot from "@/components/ChatBot"
import DocumentViewer from "@/components/DocumentViewer"
import { loadPDFs, searchInPDFs } from "@/lib/pdfUtils"
import InstallPrompt from "@/components/InstallPrompt"
import OfflineIndicator from "@/components/OfflineIndicator"

export default function HomePage() {
  const [pdfs, setPdfs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState(null)
  const [currentView, setCurrentView] = useState("home") // "home", "search", "pdf"
  const [documentViewer, setDocumentViewer] = useState({ isOpen: false, document: null, page: 1 })
  const [loadingStatus, setLoadingStatus] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      initializePDFs()
    }
  }, [mounted])

  const initializePDFs = async () => {
    try {
      setLoadingStatus("Inicializando sistema...")
      toast.loading("Cargando documentos PDF...", { id: "loading-pdfs" })

      setLoadingStatus("Cargando archivos PDF...")
      const loadedPDFs = await loadPDFs()

      setPdfs(loadedPDFs)
      setLoadingStatus("Documentos cargados exitosamente")

      // Determinar si se cargaron PDFs reales o mock
      const hasRealPdfs = loadedPDFs.some((pdf) => pdf.url && !pdf.url.includes("mock"))

      if (hasRealPdfs) {
        toast.success(`✅ ${loadedPDFs.length} documentos PDF cargados`, { id: "loading-pdfs" })
      } else {
        toast.success(`📋 ${loadedPDFs.length} documentos de ejemplo cargados`, {
          id: "loading-pdfs",
          icon: "📋",
        })
      }
    } catch (error) {
      console.error("Error loading PDFs:", error)
      setLoadingStatus("Error al cargar documentos")
      toast.error("Error al cargar documentos", { id: "loading-pdfs" })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setCurrentView("home")
      return
    }

    setSearching(true)
    setCurrentView("search")

    try {
      const targetPdfs = selectedPdf ? [selectedPdf] : pdfs
      const results = await searchInPDFs(targetPdfs, searchQuery)
      setSearchResults(results)

      if (results.length === 0) {
        toast("No se encontraron resultados", { icon: "🔍" })
      } else {
        toast.success(`Encontrados ${results.length} resultados`)
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Error en la búsqueda")
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handlePdfSelect = (pdf) => {
    setSelectedPdf(pdf)
    setCurrentView("pdf")
    setSearchQuery("")
    setSearchResults([])
  }

  const handleHomeClick = () => {
    setCurrentView("home")
    setSelectedPdf(null)
    setSearchQuery("")
    setSearchResults([])
  }

  const clearPdfFilter = () => {
    setSelectedPdf(null)
    if (searchQuery.trim()) {
      handleSearch() // Re-search in all PDFs
    }
  }

  const openDocumentViewer = (document, page = 1) => {
    // Si el documento no tiene toda la información, intentar encontrarlo en la lista de PDFs
    let fullDocument = document

    if (!document.textContent || !document.pages) {
      fullDocument =
        pdfs.find(
          (pdf) =>
            pdf.displayName === document.displayName ||
            pdf.displayName.toLowerCase().includes(document.displayName.toLowerCase()) ||
            document.displayName.toLowerCase().includes(pdf.displayName.toLowerCase()),
        ) || document
    }

    setDocumentViewer({
      isOpen: true,
      document: fullDocument,
      page: page || 1,
    })
  }

  const closeDocumentViewer = () => {
    setDocumentViewer({ isOpen: false, document: null, page: 1 })
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Enhanced Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">

              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
              >
                Buscador de Estándares
              </motion.h1>
              
            </div>
            

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-sm text-gray-400"
            >
              
              <FileText size={16} />
              <span>{pdfs.length} documentos</span>
              {pdfs.length > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-xs text-green-400">Listos</span>
                </div>
              )}
                            <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
              >
                <Home size={20} />
                <span className="hidden sm:inline">Inicio</span>
              </button>
            </motion.div>
          </div>

          {/* PDF Filter */}
          {selectedPdf && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg"
            >
              <Filter size={16} className="text-purple-400" />
              <span className="text-purple-200 text-sm">Buscando en: {selectedPdf.displayName}</span>
              <button
                onClick={clearPdfFilter}
                className="ml-auto text-purple-400 hover:text-purple-300 text-sm underline"
              >
                Buscar en todos
              </button>
            </motion.div>
          )}

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={
                selectedPdf ? `Buscar en ${selectedPdf.displayName}...` : "Buscar en todos los documentos..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-20 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
            </button>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
            <p className="text-gray-400 mb-2">Cargando documentos...</p>
            <p className="text-sm text-gray-500">{loadingStatus}</p>
          </motion.div>
        ) : currentView === "search" ? (
          <SearchResults results={searchResults} query={searchQuery} onDocumentClick={openDocumentViewer} />
        ) : currentView === "pdf" && selectedPdf ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-200 mb-2">{selectedPdf.displayName}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{selectedPdf.pages} páginas</span>
                <span>•</span>
                <span className="capitalize">{selectedPdf.category}</span>
                <span>•</span>
                <span>{(selectedPdf.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Contenido del documento</h3>
              <div className="space-y-4">
                {selectedPdf.textContent?.map((page, index) => (
                  <div key={index} className="border-l-2 border-purple-500/30 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-purple-400">Página {page.page}</div>
                      <button
                        onClick={() => openDocumentViewer(selectedPdf, page.page)}
                        className="text-xs text-purple-400 hover:text-purple-300 underline"
                      >
                        Ver página completa
                      </button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{page.text.substring(0, 300)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-200">Documentos Disponibles</h2>
              <div className="text-sm text-gray-400">💡 Tip: Usa el chatbot para búsquedas inteligentes con IA</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfs.map((pdf, index) => (
                <motion.div
                  key={pdf.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handlePdfSelect(pdf)}
                >
                  <PDFCard pdf={pdf} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Enhanced Chat Bot */}
      <ChatBot
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        pdfs={pdfs}
        selectedPdf={selectedPdf}
        onDocumentClick={openDocumentViewer}
      />

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={documentViewer.isOpen}
        onClose={closeDocumentViewer}
        document={documentViewer.document}
        initialPage={documentViewer.page}
      />

      {/* PWA Components */}
      <InstallPrompt />
      <OfflineIndicator />
    </div>
  )
}
