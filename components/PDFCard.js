"use client"

import { motion } from "framer-motion"
import { FileText, Calendar, Hash, MousePointer } from "lucide-react"

export default function PDFCard({ pdf }) {
  const getCategoryColor = (category) => {
    const colors = {
      técnico: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      normativo: "bg-green-500/20 text-green-400 border-green-500/30",
      procedimiento: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      guía: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    }
    return colors[category?.toLowerCase()] || colors.default
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-purple-400 group-hover:text-purple-300 transition-colors" size={20} />
            <span className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(pdf.category)}`}>
              {pdf.category || "Documento"}
            </span>
          </div>
          <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors line-clamp-2">
            {pdf.displayName}
          </h3>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Hash size={14} />
          <span>{pdf.pages} páginas</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>Cargado recientemente</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{(pdf.size / 1024 / 1024).toFixed(1)} MB</span>
          <div className="flex items-center gap-2 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <MousePointer size={12} />
            <span>Clic para ver</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
