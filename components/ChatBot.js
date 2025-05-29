"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bot,
  Send,
  Copy,
  Loader2,
  X,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Search,
  FileText,
  CheckCircle,
  HelpCircle,
  BookOpen,
  Lightbulb,
  Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"
import { searchInPDFs } from "@/lib/pdfUtils"

export default function ChatBot({ isOpen, onToggle, pdfs, selectedPdf, onDocumentClick }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchPhase, setSearchPhase] = useState("idle")
  const [searchResults, setSearchResults] = useState([])
  const [showAISearch, setShowAISearch] = useState(false)
  const messagesEndRef = useRef(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchHistory, setSearchHistory] = useState([])
  const [showHelp, setShowHelp] = useState(false)

  // Mensajes de ayuda y sugerencias
  const helpMessages = [
    {
      title: "¿Cómo buscar información?",
      content: "Puedes preguntar de forma natural, por ejemplo:\n• ¿Qué necesito para hacer un alambrado?\n• ¿Cuáles son los requisitos de seguridad?\n• ¿Cómo se hace el mantenimiento de equipos?"
    },
    {
      title: "¿Cómo usar las referencias?",
      content: "Cuando encuentres información relevante, haz clic en 'Ver en documento' para abrir el PDF en la página exacta donde está la información."
    },
    {
      title: "¿Cómo obtener más detalles?",
      content: "Si necesitas más información, usa el botón 'Usar búsqueda asistida por IA' para obtener una explicación más detallada y contextualizada."
    }
  ]

  const exampleQueries = [
    "¿Qué necesito para hacer un alambrado?",
    "¿Cuáles son los requisitos de seguridad?",
    "¿Cómo se hace el mantenimiento de equipos?",
    "¿Qué documentos necesito para un proyecto?",
    "¿Cuáles son los estándares de calidad?"
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSearch = async (query) => {
    if (!query.trim()) return

    setIsLoading(true)
    setSearchPhase("searching")
    setMessages(prev => [...prev, { role: "user", content: query }])

    try {
      const results = await searchInPDFs(pdfs, query)
      
      // Extraer palabras clave del query
      const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      
      // Ordenar y filtrar resultados por relevancia
      const sortedResults = results
        .map(result => {
          // Calcular score de relevancia
          const content = result.contexts[0].toLowerCase()
          const title = result.title.toLowerCase()
          
          // Score basado en coincidencias exactas
          const exactMatches = keywords.filter(keyword => 
            content.includes(keyword) || title.includes(keyword)
          ).length
          
          // Score basado en coincidencias parciales
          const partialMatches = keywords.filter(keyword => 
            content.includes(keyword.slice(0, 4)) || title.includes(keyword.slice(0, 4))
          ).length
          
          // Score basado en posición de la coincidencia
          const positionScore = keywords.reduce((score, keyword) => {
            const contentIndex = content.indexOf(keyword)
            const titleIndex = title.indexOf(keyword)
            return score + (contentIndex === -1 ? 0 : 1 / (contentIndex + 1)) + 
                          (titleIndex === -1 ? 0 : 1 / (titleIndex + 1))
          }, 0)
          
          return {
            ...result,
            relevanceScore: exactMatches * 2 + partialMatches + positionScore
          }
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5) // Limitar a los 5 resultados más relevantes

      setSearchResults(sortedResults)

      if (sortedResults.length > 0) {
        const formattedResults = sortedResults.map(result => ({
          fileName: result.fileName,
          page: result.page,
          contexts: result.contexts,
          score: result.relevanceScore,
          url: result.url,
          category: result.category,
          title: result.title
        }))

        const responseMessage = {
          role: "assistant",
          content: `He encontrado ${sortedResults.length} resultados relevantes sobre "${query}".\n\n${
            sortedResults.length > 3 
              ? "Los resultados más relevantes son:" 
              : "Aquí están los resultados:"
          }`,
          results: formattedResults
        }

        setMessages(prev => [...prev, responseMessage])
        setSearchHistory(prev => [
          { query, timestamp: new Date(), results: formattedResults },
          ...prev.slice(0, 9)
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: `No encontré resultados exactos para "${query}".\n\nPuedo ayudarte a:\n1. Buscar con términos más generales\n2. Usar la búsqueda asistida por IA para encontrar información relacionada\n\n¿Qué prefieres?`
          }
        ])
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, hubo un error al realizar la búsqueda. Por favor, intenta de nuevo o reformula tu pregunta."
        }
      ])
    } finally {
      setIsLoading(false)
      setSearchPhase("idle")
    }
  }

  const handleAISearch = async (query, results) => {
    setIsLoading(true)
    setSearchPhase("processing")

    try {
      // Preparar el contexto para la IA
      const context = results.slice(0, 3).map(result => ({
        title: result.title,
        page: result.page,
        content: result.contexts[0]
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `Basado en los siguientes fragmentos de documentos, responde a la pregunta: "${query}"\n\nContexto:\n${
            context.map(doc => `📄 ${doc.title} (página ${doc.page}):\n${doc.content}`).join("\n\n")
          }\n\nPor favor, proporciona una respuesta concisa y estructurada, incluyendo referencias específicas a las páginas de los documentos cuando sea relevante.`
        })
      })

      if (!response.ok) {
        throw new Error("Error en la respuesta de la IA")
      }

      const data = await response.json()

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          results: results
        }
      ])
    } catch (error) {
      console.error("Error en la búsqueda con IA:", error)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, hubo un error al procesar la búsqueda con IA. Por favor, intenta de nuevo o reformula tu pregunta."
        }
      ])
    } finally {
      setIsLoading(false)
      setSearchPhase("idle")
      }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const query = input.trim()
    setInput("")
    await handleSearch(query)
  }

  const handleExampleClick = (example) => {
    setInput(example)
          }

  const handleDocumentClick = (fileName, page) => {
    const document = pdfs.find(pdf => pdf.displayName === fileName)
      if (document && onDocumentClick) {
        onDocumentClick(document, page)
      toast.success(`Abriendo ${document.displayName}, página ${page}`)
    }
  }

  const copyMessage = (content) => {
    const cleanContent = content
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)\]$$[^)]+$$/g, "$1")
      .replace(/\n/g, " ")
    navigator.clipboard.writeText(cleanContent)
    toast.success("Copiado al portapapeles")
  }

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: isOpen ? "0 0 0 0 rgba(147, 51, 234, 0)" : "0 0 0 8px rgba(147, 51, 234, 0.3)",
        }}
        transition={{ duration: 1, repeat: isOpen ? 0 : Number.POSITIVE_INFINITY }}
      >
        <Bot className="text-white" size={24} />
      </motion.button>

      {/* Ventana del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl z-40 flex flex-col"
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Asistente de Estándares</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-400" />
                    {selectedPdf ? `Consultando: ${selectedPdf.displayName}` : "Consultando todos los documentos"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Ayuda"
                >
                  <HelpCircle size={20} />
                </button>
              <button onClick={onToggle} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="font-medium">¡Hola! Soy tu asistente de estándares</p>
                  <p className="text-sm mt-2 text-gray-500">
                    Puedo ayudarte a encontrar información en los documentos de estándares.
                  </p>
                  
                  {/* Ejemplos de preguntas */}
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-medium text-gray-400">Ejemplos de preguntas:</p>
                    {exampleQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(query)}
                        className="block w-full text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>

                  {/* Mensajes de ayuda */}
                  {showHelp && (
                    <div className="mt-6 space-y-4">
                      {helpMessages.map((help, index) => (
                        <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <Lightbulb size={14} className="text-yellow-400" />
                            {help.title}
                          </h4>
                          <p className="text-xs text-gray-400 whitespace-pre-line">{help.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <div
                    className={`p-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "bg-gray-800/50 border border-gray-700"
                    }`}
                  >
                    {message.role === "user" ? (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs text-white font-medium">U</span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot size={12} className="text-white" />
                        </div>
                        <div className="text-sm space-y-2 flex-1">
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          
                          {message.results && (
                            <div className="mt-4 space-y-3">
                              {message.results.map((result, i) => (
                                <div key={i} className="bg-gray-700/50 p-3 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText size={14} className="text-blue-400" />
                                    <span className="text-sm font-medium">{result.title}</span>
                                  </div>
                                  <div className="text-xs text-gray-300 mb-2">
                                    Página {result.page}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {result.contexts[0]}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => handleDocumentClick(result.fileName, result.page)}
                                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      <ExternalLink size={12} />
                                      Ver en documento
                                    </button>
                                    <button
                                      onClick={() => window.open(result.url, '_blank')}
                                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                    >
                                      <FileText size={12} />
                                      Abrir PDF
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {message.results && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-700/50">
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 text-blue-400">
                              <FileText size={12} />
                            <span>{message.results.length} ref.</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          {message.results && message.results.length > 0 && (
                            <>
                            <button
                                onClick={() => handleAISearch(message.content, message.results)}
                                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                            >
                                <Sparkles size={12} />
                                Mejorar búsqueda con IA
                            </button>
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                          >
                            <Copy size={12} />
                            Copiar
                          </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                  <div className="bg-gray-800/50 border border-gray-700 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      {searchPhase === "searching" && (
                        <>
                          <Search className="w-4 h-4 animate-pulse text-blue-400" />
                          <span className="text-sm text-gray-400">Buscando en documentos...</span>
                        </>
                      )}
                      {searchPhase === "processing" && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                          <span className="text-sm text-gray-400">Procesando con IA...</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre los estándares..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white p-2 rounded-xl transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
