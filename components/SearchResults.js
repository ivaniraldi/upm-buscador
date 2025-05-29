"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FileText, MapPin, Search, ExternalLink, ChevronRight, ChevronDown } from "lucide-react"

// Función mejorada para resaltar texto con manejo de valores undefined
const highlightText = (text, searchTerm) => {
  if (!text || !searchTerm) return text

  try {
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"))
    return parts.map((part, i) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded">
            {part}
          </mark>
        )
      }
      return part
    })
  } catch (error) {
    console.warn("Error al resaltar texto:", error)
    return text
  }
}

export default function SearchResults({ results, query, onDocumentClick }) {
  const [expandedResults, setExpandedResults] = useState({})

  const toggleResult = (index) => {
    setExpandedResults((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  if (results.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No se encontraron resultados</h3>
        <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-200">Resultados de búsqueda</h2>
        <span className="text-sm text-gray-400">
          {results.length} resultado{results.length !== 1 ? "s" : ""}
        </span>
      </div>

      {results.map((result, index) => (
        <motion.div
          key={`${result.fileName}-${result.page}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FileText className="text-purple-400" size={20} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-white truncate">{result.fileName}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                  <MapPin size={12} />
                  <span>Página {result.page}</span>
                </div>
              </div>

              {expandedResults[index] && (
                <div className="mt-4 space-y-3">
                  {result.contexts && result.contexts.map((context, i) => (
                    <div key={i} className="text-gray-700 bg-gray-50 p-3 rounded">
                      {highlightText(context, query)}
                    </div>
                  ))}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => onDocumentClick(result.fileName, result.page)}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink size={16} />
                      Ver en documento
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => toggleResult(index)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expandedResults[index] ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
