"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  ImageIcon,
  Download,
  Printer,
  Bookmark,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Table,
  List,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { formatPDFContent } from "@/lib/pdfUtils"

export default function DocumentViewer({ isOpen, onClose, document, initialPage = 1 }) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [searchTerm, setSearchTerm] = useState("")
  const [formattedContent, setFormattedContent] = useState("")
  const [pageImages, setPageImages] = useState([])
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [viewMode, setViewMode] = useState("page") // page, continuous
  const [outline, setOutline] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (document && isOpen) {
      setCurrentPage(initialPage)
      loadPageContent(initialPage)
      generateOutline()
    }
  }, [document, isOpen, initialPage])

  useEffect(() => {
    if (document && isOpen) {
      loadPageContent(currentPage)
    }
  }, [currentPage, document, isOpen])

  const generateOutline = () => {
    if (!document?.textContent) return

    const headings = []
    document.textContent.forEach((page) => {
      const lines = page.text.split('\n')
      lines.forEach((line) => {
        if (line.startsWith('## ')) {
          headings.push({
            title: line.replace('## ', ''),
            page: page.page
          })
        }
      })
    })
    setOutline(headings)
  }

  const loadPageContent = (pageNum) => {
    if (!document || !document.textContent) return

    const pageContent = document.textContent.find((page) => page.page === pageNum)

    if (pageContent) {
      // Formatear el contenido para mejor visualización
      const formatted = formatPDFContent(pageContent.text)
      setFormattedContent(formatted)

      // Cargar imágenes de la página
      if (pageContent.images && pageContent.images.length > 0) {
        setPageImages(pageContent.images)
      } else {
        setPageImages([])
      }
    } else {
      setFormattedContent("Contenido no disponible para esta página.")
      setPageImages([])
    }
  }

  const highlightSearchTerm = (content) => {
    if (!searchTerm.trim()) return content

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return content.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-100 px-1 rounded">$1</mark>')
  }

  const handleZoom = (delta) => {
    setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleViewModeChange = () => {
    setViewMode(prev => prev === "page" ? "continuous" : "page")
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= document.pages) {
      setCurrentPage(pageNum)
    }
  }

  if (!document) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
            isFullscreen ? 'fixed inset-0 z-50' : ''
          }`}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 border border-gray-700 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{document.displayName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>
                      Página {currentPage} de {document.pages}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="capitalize">{document.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Imprimir"
                >
                  <Printer size={18} />
                </button>
                <button
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Descargar"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Sidebar */}
              <div className="w-64 border-r border-gray-700 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Outline */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Índice</h4>
                    <div className="space-y-1">
                      {outline.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToPage(item.page)}
                          className={`w-full text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors ${
                            item.page === currentPage ? 'bg-gray-800' : ''
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Mode */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Modo de Vista</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewModeChange()}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === "page"
                            ? "bg-purple-500 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                        title="Vista de página"
                      >
                        <Maximize2 size={18} />
                      </button>
                      <button
                        onClick={() => handleViewModeChange()}
                        className={`p-2 rounded-lg transition-colors ${
                          viewMode === "continuous"
                            ? "bg-purple-500 text-white"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }`}
                        title="Vista continua"
                      >
                        <Minimize2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Zoom</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleZoom(-0.1)}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        title="Reducir zoom"
                      >
                        <ZoomOut size={18} />
                      </button>
                      <span className="text-sm text-gray-300">{Math.round(zoom * 100)}%</span>
                      <button
                        onClick={() => handleZoom(0.1)}
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        title="Aumentar zoom"
                      >
                        <ZoomIn size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Rotación</h4>
                    <button
                      onClick={handleRotate}
                      className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                      title="Rotar 90°"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                <div
                  ref={contentRef}
                  className="max-w-3xl mx-auto"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center top",
                    transition: "transform 0.2s ease-in-out",
                  }}
                >
                  <div className="bg-white text-gray-900 rounded-lg p-8 shadow-lg">
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <h2 className="text-2xl font-bold mb-2">{document.displayName}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Página {currentPage}</span>
                        <span>•</span>
                        <span className="capitalize">{document.category}</span>
                      </div>
                    </div>

                    {/* Contenido del PDF con formato mejorado */}
                    <div
                      className={`prose max-w-none text-gray-800 leading-relaxed ${
                        viewMode === "continuous" ? "space-y-8" : ""
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerm(formattedContent),
                      }}
                    />

                    {/* Imágenes del documento */}
                    {pageImages.length > 0 && (
                      <div className="mt-8 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                          <ImageIcon size={18} />
                          <span>Imágenes en esta página</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pageImages.map((img, idx) => (
                            <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden">
                              <img
                                src={img.data}
                                alt={`Imagen ${idx + 1}`}
                                className="w-full h-auto object-contain"
                                width={img.width}
                                height={img.height}
                              />
                              <div className="p-2 bg-gray-100 text-sm text-gray-500">
                                Figura {currentPage}.{idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Search in Document */}
            <div className="border-t border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en este documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="text-xs text-gray-500">💡 Tip: Usa Ctrl+F para buscar en la página actual</div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={document.pages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Number.parseInt(e.target.value)
                    if (page >= 1 && page <= document.pages) {
                      goToPage(page)
                    }
                  }}
                  className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center text-white text-sm"
                />
                <span className="text-gray-400">de {document.pages}</span>
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === document.pages}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Fullscreen Button */}
            <div className="flex items-center justify-center p-4 border-t border-gray-700">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
