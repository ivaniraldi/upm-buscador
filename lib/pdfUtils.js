// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Cache para documentos procesados
const pdfCache = new Map()

// Configuración de PDF.js
const PDFJS_CONFIG = {
  cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
  disableFontFace: false,
  isEvalSupported: true,
  useSystemFonts: true,
  maxCanvasPixels: 16777216,
  disableStream: false,
  disableAutoFetch: false,
  disableRange: false,
  disableWorker: false,
  workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

// Load PDF.js from CDN using script tag
async function loadPDFJS() {
  if (!isBrowser) {
    throw new Error("PDF.js not available in server environment")
  }

  // Check if PDF.js is already loaded
  if (window.pdfjsLib) {
    return window.pdfjsLib
  }

  return new Promise((resolve, reject) => {
    // Load PDF.js from CDN
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    script.onload = () => {
      if (window.pdfjsLib) {
        // Configure worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CONFIG.workerSrc
        resolve(window.pdfjsLib)
      } else {
        reject(new Error("PDF.js failed to load"))
      }
    }
    script.onerror = () => reject(new Error("Failed to load PDF.js script"))
    document.head.appendChild(script)
  })
}

// Función mejorada para cargar y procesar PDFs
export async function loadPDFs() {
  if (!isBrowser) {
    console.warn("PDF loading not available in server environment")
    return getMockPDFs()
  }

  try {
    console.log("Intentando cargar PDFs reales...")

    // Load PDF.js dynamically
    const pdfjsLib = await loadPDFJS()

    // Lista de PDFs disponibles
    const pdfFiles = [
      {
        path: "/assets/pdfs/estandares-camineria.pdf",
        name: "estandares-camineria.pdf",
        displayName: "estandares-camineria",
        category: "Estándares",
      },
      {
        path: "/assets/pdfs/estandares-generales.pdf",
        name: "estandares-generales.pdf",
        displayName: "estandares-generales",
        category: "Estándares",
      },
      {
        path: "/assets/pdfs/estandares-operativos-carga-y-gestion-de-acopios.pdf",
        name: "estandares-operativos-carga-y-gestion-de-acopios.pdf",
        displayName: "estandares-operativos-carga-y-gestion-de-acopios",
        category: "Estándares",
      },
      {
        path: "/assets/pdfs/estandares-operativos-cosecha-y-ext-madera.pdf",
        name: "estandares-operativos-cosecha-y-ext-madera.pdf",
        displayName: "estandares-operativos-cosecha-y-extraccion-madera",
        category: "Estándares",
      },
      {
        path: "/assets/pdfs/estandares-operativos-vivero-san-francisco.pdf",
        name: "estandares-operativos-vivero-san-francisco.pdf",
        displayName: "estandares-operativos-vivero-san-francisco",
        category: "Estándares",
      },
      {
        path: "/assets/pdfs/estandares-operativos-vivero-santana.pdf",
        name: "estandares-operativos-vivero-santana.pdf",
        displayName: "estandares-operativos-vivero-santana",
        category: "Estándares",
      },
    ]

    const pdfs = []
    let realPdfsLoaded = 0

    for (const fileInfo of pdfFiles) {
      try {
        console.log(`Intentando cargar: ${fileInfo.path}`)
        const pdfData = await loadAndProcessPDF(fileInfo.path, pdfjsLib)

        if (pdfData) {
          pdfs.push({
            name: fileInfo.name,
            displayName: fileInfo.displayName,
            category: fileInfo.category,
            ...pdfData,
          })
          realPdfsLoaded++
          console.log(`✅ PDF cargado exitosamente: ${fileInfo.displayName}`)
        }
      } catch (error) {
        console.warn(`⚠️ Error loading ${fileInfo.path}:`, error)
        // Agregar datos mock para este archivo específico
        const mockData = getMockDataForFile(fileInfo)
        if (mockData) {
          pdfs.push(mockData)
        }
      }
    }

    // Si se cargaron algunos PDFs reales, usar esos
    if (realPdfsLoaded > 0) {
      console.log(`✅ Se cargaron ${realPdfsLoaded} PDFs reales`)
      return pdfs
    }

    // Si no se pudieron cargar PDFs reales, usar datos mock completos
    console.warn("⚠️ No se pudieron cargar PDFs reales, usando datos mock")
    return getMockPDFs()
  } catch (error) {
    console.error("❌ Error general en loadPDFs:", error)
    return getMockPDFs()
  }
}

// Función mejorada para cargar y procesar un PDF individual
async function loadAndProcessPDF(url, pdfjsLib) {
  if (!isBrowser || !pdfjsLib) {
    console.warn("PDF processing not available")
    return null
  }

  try {
    // Verificar cache primero
    if (pdfCache.has(url)) {
      console.log(`📋 Usando PDF desde cache: ${url}`)
      return pdfCache.get(url)
    }

    console.log(`🔄 Cargando PDF: ${url}`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log(`📄 PDF descargado, tamaño: ${arrayBuffer.byteLength} bytes`)

    // Configurar opciones de carga
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      ...PDFJS_CONFIG
    })

    const pdf = await loadingTask.promise
    console.log(`📖 PDF procesado, páginas: ${pdf.numPages}`)

    const textContent = []
    const metadata = await pdf.getMetadata()
    const numPages = pdf.numPages

    // Procesar páginas en paralelo con límite de concurrencia
    const concurrencyLimit = 3
    const chunks = []
    for (let i = 1; i <= numPages; i += concurrencyLimit) {
      chunks.push(Array.from({ length: Math.min(concurrencyLimit, numPages - i + 1) }, (_, j) => i + j))
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (pageNum) => {
          try {
            const page = await pdf.getPage(pageNum)
            const content = await page.getTextContent()
            
            // Extraer texto con estructura
            const pageText = content.items.reduce((acc, item) => {
              // Agrupar por líneas basado en la posición Y
              const lineKey = Math.round(item.transform[5])
              if (!acc[lineKey]) {
                acc[lineKey] = []
              }
              acc[lineKey].push(item.str)
              return acc
            }, {})

            // Procesar el texto línea por línea
            const processedLines = Object.entries(pageText)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([_, words]) => words.join(' '))
              .join('\n')

            // Extraer imágenes de la página
            let images = []
            try {
              images = await extractImagesFromPage(page)
            } catch (imgError) {
              console.warn(`⚠️ Error al extraer imágenes de la página ${pageNum}:`, imgError)
            }

            if (processedLines) {
              // Limpiar y formatear el texto
              const cleanedText = cleanAndFormatText(processedLines)
              textContent.push({
                page: pageNum,
                text: cleanedText,
                images,
                pageSize: {
                  width: page.getViewport({ scale: 1 }).width,
                  height: page.getViewport({ scale: 1 }).height
                }
              })
            }
          } catch (pageError) {
            console.warn(`⚠️ Error procesando página ${pageNum}:`, pageError)
            // Agregar una entrada vacía para mantener el orden de las páginas
            textContent.push({
              page: pageNum,
              text: `Error al procesar la página ${pageNum}`,
              images: [],
              pageSize: { width: 0, height: 0 }
            })
          }
        })
      )
    }

    // Ordenar el contenido por número de página
    textContent.sort((a, b) => a.page - b.page)

    const pdfData = {
      pages: numPages,
      textContent,
      size: arrayBuffer.byteLength,
      url,
      metadata: metadata?.info || {},
      title: metadata?.info?.Title || url.split('/').pop(),
      author: metadata?.info?.Author || 'Unknown',
      creationDate: metadata?.info?.CreationDate || null,
      lastModified: metadata?.info?.ModDate || null
    }

    // Guardar en cache
    pdfCache.set(url, pdfData)
    console.log(`✅ PDF procesado y guardado en cache: ${url}`)

    return pdfData
  } catch (error) {
    console.error(`❌ Error processing PDF ${url}:`, error)
    return null
  }
}

// Función mejorada para extraer imágenes de una página
async function extractImagesFromPage(page) {
  try {
    const images = []
    const ops = await page.getOperatorList()
    const commonObjs = page.commonObjs
    const objs = page.objs
    
    // Esperar a que los objetos comunes estén resueltos
    await Promise.all(
      ops.fnArray.map(async (fn, i) => {
        if (fn === pdfjsLib.OPS.paintImageXObject) {
          const imgName = ops.argsArray[i][0]
          try {
            // Esperar a que el objeto de imagen esté disponible
            const img = await new Promise((resolve, reject) => {
              const checkImage = () => {
                const image = objs.get(imgName)
                if (image) {
                  resolve(image)
                } else {
                  setTimeout(checkImage, 100)
                }
              }
              checkImage()
            })

            if (img && img.width > 100 && img.height > 100) {
              // Convertir la imagen a base64
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              canvas.width = img.width
              canvas.height = img.height
              
              // Dibujar la imagen en el canvas
              ctx.drawImage(img, 0, 0)
              
              // Obtener la imagen como base64
              const dataUrl = canvas.toDataURL('image/png')
              
              images.push({
                data: dataUrl,
                width: img.width,
                height: img.height,
                format: 'png'
              })
            }
          } catch (imgError) {
            console.warn(`⚠️ Error al procesar imagen ${imgName}:`, imgError)
          }
        }
      })
    )

    return images
  } catch (error) {
    console.warn('⚠️ Error al extraer imágenes:', error)
    return []
  }
}

// Función mejorada para limpiar y formatear texto
function cleanAndFormatText(text) {
  return text
    // Normalizar espacios y saltos de línea
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    
    // Preservar caracteres especiales del español
    .replace(/[áàäâ]/g, 'á')
    .replace(/[éèëê]/g, 'é')
    .replace(/[íìïî]/g, 'í')
    .replace(/[óòöô]/g, 'ó')
    .replace(/[úùüû]/g, 'ú')
    .replace(/[ñ]/g, 'ñ')
    .replace(/[ÁÀÄÂ]/g, 'Á')
    .replace(/[ÉÈËÊ]/g, 'É')
    .replace(/[ÍÌÏÎ]/g, 'Í')
    .replace(/[ÓÒÖÔ]/g, 'Ó')
    .replace(/[ÚÙÜÛ]/g, 'Ú')
    .replace(/[Ñ]/g, 'Ñ')
    
    // Detectar y formatear títulos
    .replace(/^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{3,}[A-ZÁÉÍÓÚÑ])([.:])(\s|$)/gm, '## $1$2\n')
    .replace(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,}):(\s|$)/gm, '### $1:\n')
    
    // Detectar y formatear listas
    .replace(/^(\d+\.\s+[^.]+\.)/gm, '- $1')
    .replace(/^•\s+([^•]+)(?=•|$)/gm, '- $1')
    
    // Detectar y formatear tablas
    .replace(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g, '| $1 | $2 | $3 | $4 |')
    
    // Detectar y formatear medidas y unidades
    .replace(/(\d+(?:\.\d+)?)\s*(mm|cm|m|kg|g|L|ml)/g, '$1$2')
    
    // Limpiar caracteres especiales problemáticos manteniendo los del español
    .replace(/[^\w\s.,:;!?\-()[\]]/g, ' ')
    
    // Asegurar espacios correctos entre palabras
    .replace(/(\w)\s+(\w)/g, '$1 $2')
    
    // Formatear párrafos
    .replace(/([^<>]+)(?=<|$)/g, (match) => {
      if (match.trim() && !match.startsWith('-') && !match.startsWith('#')) {
        return `\n${match.trim()}\n`
      }
      return match
    })
    
    .trim()
}

// Función mejorada para formatear el contenido del PDF para visualización
export function formatPDFContent(text) {
  if (!text) return ""

  return text
    // Formatear títulos
    .replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3 text-gray-800">$1</h3>')
    
    // Formatear listas
    .replace(/^- (.*?)$/gm, '<li class="ml-6 list-disc mb-2 text-gray-700">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>)+/g, '<ul class="my-4">$&</ul>')
    
    // Formatear tablas
    .replace(/\| (.*?) \|/g, (match) => {
      const cells = match.split('|').filter(cell => cell.trim())
      return `<td class="border border-gray-300 px-4 py-2">${cells.join('</td><td class="border border-gray-300 px-4 py-2">')}</td>`
    })
    .replace(/(<td[^>]*>.*<\/td>)+/g, '<tr class="border-b border-gray-300">$&</tr>')
    .replace(/(<tr[^>]*>.*<\/tr>)+/g, '<table class="w-full border-collapse my-4">$&</table>')
    
    // Formatear párrafos
    .replace(/\n\n([^<]+)\n\n/g, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>')
    
    // Formatear términos importantes
    .replace(
      /(Requisitos|Especificaciones|Criterios|Objetivo|Alcance|Responsabilidades|Proceso|Materiales|Herramientas):/g,
      '<strong class="font-semibold text-gray-900">$1:</strong>'
    )
    
    // Formatear medidas y unidades
    .replace(
      /(\d+(?:\.\d+)?)(mm|cm|m|kg|g|L|ml)/g,
      '<span class="font-mono text-blue-700">$1</span><span class="text-blue-600">$2</span>'
    )
    
    // Formatear notas y advertencias
    .replace(
      /(NOTA|ADVERTENCIA|IMPORTANTE):(.*?)(?=\n\n|$)/g,
      '<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4"><strong class="text-yellow-800">$1:</strong><span class="text-yellow-700">$2</span></div>'
    )
}

function getMockDataForFile(fileInfo) {
  const mockData = getMockPDFs()
  return mockData.find((pdf) => pdf.displayName === fileInfo.displayName || pdf.category === fileInfo.category)
}

// Mock data for when PDFs are not available
function getMockPDFs() {
  return [
    {
      name: "documento-tecnico-1.pdf",
      displayName: "Documento Técnico de Calidad",
      category: "técnico",
      pages: 25,
      size: 1024000,
      textContent: [
        {
          page: 1,
          text: "DOCUMENTO TÉCNICO DE CALIDAD\n\nEste documento establece los procedimientos y estándares técnicos para la implementación de sistemas de gestión de calidad en organizaciones industriales. El objetivo principal es garantizar la conformidad con las normas internacionales ISO 9001:2015.\n\nAlcance del Documento:\n• Procedimientos de control de calidad\n• Metodologías de inspección\n• Criterios de aceptación y rechazo\n• Documentación requerida\n\nResponsabilidades:\nEl departamento de calidad será responsable de la implementación y seguimiento de todos los procedimientos descritos en este documento.",
        },
        {
          page: 2,
          text: "CAPÍTULO 2: METODOLOGÍAS Y PROCESOS\n\nEste capítulo describe las metodologías recomendadas para la implementación de estándares técnicos en organizaciones. Se incluyen diagramas de flujo y procedimientos paso a paso para garantizar una implementación exitosa.\n\nProceso de Implementación:\n1. Diagnóstico inicial: Evaluación del estado actual\n2. Planificación: Desarrollo del plan de implementación\n3. Ejecución: Implementación de los cambios\n4. Verificación: Auditorías y revisiones\n5. Mejora continua: Optimización del sistema\n\nHerramientas requeridas:\n• Software de gestión documental\n• Equipos de medición calibrados\n• Personal capacitado",
        },
        {
          page: 3,
          text: "SECCIÓN 3: HERRAMIENTAS DE EVALUACIÓN\n\nPresenta las herramientas necesarias para evaluar la conformidad con los estándares establecidos. Incluye listas de verificación y criterios de auditoría.\n\nLista de Verificación Principal:\n• Documentación actualizada\n• Procedimientos implementados\n• Personal capacitado\n• Equipos calibrados\n• Registros de calidad completos\n\nCriterios de Auditoría:\n• Conformidad con ISO 9001:2015\n• Efectividad de los procesos\n• Satisfacción del cliente\n• Mejora continua demostrable",
        },
      ],
    },
    {
      name: "norma-iso-9001.pdf",
      displayName: "Norma ISO 9001:2015",
      category: "normativo",
      pages: 45,
      size: 2048000,
      textContent: [
        {
          page: 1,
          text: "NORMA INTERNACIONAL ISO 9001:2015\n\nSistemas de gestión de calidad - Requisitos\n\nISO 9001 es un estándar internacional que especifica los requisitos para un sistema de gestión de calidad. Las organizaciones utilizan este estándar para demostrar su capacidad de proporcionar productos y servicios que satisfagan los requisitos del cliente y los reglamentarios aplicables.\n\nBeneficios de la implementación:\n• Mejora de la satisfacción del cliente\n• Reducción de costos operativos\n• Aumento de la eficiencia\n• Mejor gestión de riesgos\n• Acceso a nuevos mercados",
        },
        {
          page: 2,
          text: "PRINCIPIOS DE GESTIÓN DE CALIDAD\n\nLa norma ISO 9001:2015 se basa en siete principios fundamentales:\n\n1. Enfoque al cliente: Cumplir y superar las expectativas del cliente\n2. Liderazgo: Crear y mantener un ambiente interno\n3. Participación del personal: Involucrar a todo el personal\n4. Enfoque basado en procesos: Gestionar actividades como procesos\n5. Mejora continua: Mejorar constantemente el desempeño\n6. Toma de decisiones basada en evidencia: Basar decisiones en datos\n7. Gestión de las relaciones: Gestionar relaciones con partes interesadas",
        },
        {
          page: 3,
          text: "CAPÍTULO 4: CONTEXTO DE LA ORGANIZACIÓN\n\n4.1 Comprensión de la organización y su contexto\n\nLa organización debe determinar las cuestiones externas e internas que son pertinentes para su propósito y que afectan a su capacidad para lograr los resultados previstos de su sistema de gestión de calidad.\n\nFactores externos:\n• Entorno legal y reglamentario\n• Competencia y mercado\n• Factores tecnológicos\n• Factores culturales y sociales\n\nFactores internos:\n• Cultura organizacional\n• Recursos disponibles\n• Estructura organizacional\n• Capacidades y conocimientos",
        },
        {
          page: 4,
          text: "CAPÍTULO 5: LIDERAZGO\n\n5.1 Liderazgo y compromiso\n\nLa alta dirección debe demostrar liderazgo y compromiso con respecto al sistema de gestión de calidad:\n\n• Asumiendo la responsabilidad y obligación de rendir cuentas\n• Asegurándose de que se establezcan la política y los objetivos de calidad\n• Asegurándose de la integración de los requisitos del SGC\n• Promoviendo el uso del enfoque a procesos\n• Asegurándose de que los recursos necesarios estén disponibles\n• Comunicando la importancia de una gestión de calidad eficaz\n• Asegurándose de que el SGC logre los resultados previstos\n• Dirigiendo y apoyando a las personas\n• Promoviendo la mejora continua",
        },
      ],
    },
    {
      name: "procedimiento-calidad.pdf",
      displayName: "Procedimiento de Control de Calidad",
      category: "procedimiento",
      pages: 15,
      size: 512000,
      textContent: [
        {
          page: 1,
          text: "PROCEDIMIENTO DE CONTROL DE CALIDAD\n\nCódigo: PC-001\nVersión: 2.1\nFecha: 2024\n\nEste documento establece los pasos necesarios para implementar un sistema de control de calidad efectivo en la organización. Define responsabilidades y metodologías de inspección para garantizar la conformidad con los estándares establecidos.\n\nObjetivo:\nAsegurar que todos los productos y servicios cumplan con los requisitos de calidad especificados mediante la implementación de controles sistemáticos y verificaciones continuas.",
        },
        {
          page: 2,
          text: "PROCESO DE INSPECCIÓN DETALLADO\n\n1. Recepción de materiales:\n• Verificar documentación de entrega\n• Inspección visual inicial\n• Toma de muestras según plan de muestreo\n• Registro de entrada en sistema\n\n2. Verificación de especificaciones:\n• Comparar con especificaciones técnicas\n• Verificar dimensiones y tolerancias\n• Comprobar propiedades físicas y químicas\n• Documentar desviaciones identificadas\n\n3. Pruebas de conformidad:\n• Realizar pruebas según normas aplicables\n• Utilizar equipos calibrados\n• Registrar todos los resultados\n• Analizar tendencias y patrones",
        },
        {
          page: 3,
          text: "CRITERIOS DE ACEPTACIÓN Y DOCUMENTACIÓN\n\nCriterios de Aceptación:\nLos productos deben cumplir con todas las especificaciones técnicas establecidas:\n• Tolerancias dimensionales: ±0.1mm\n• Acabado superficial: Ra ≤ 3.2μm\n• Resistencia mecánica: según norma ASTM\n• Pruebas eléctricas: 100% conformidad\n\nDocumentación Requerida:\n• Certificados de materiales\n• Informes de inspección\n• Registros de calibración\n• No conformidades identificadas\n• Acciones correctivas implementadas\n\nCualquier desviación debe ser documentada y evaluada por el equipo de calidad para determinar la aceptabilidad del producto.",
        },
      ],
    },
    {
      name: "guia-implementacion.pdf",
      displayName: "Guía de Implementación de Estándares",
      category: "guía",
      pages: 30,
      size: 1536000,
      textContent: [
        {
          page: 1,
          text: "GUÍA DE IMPLEMENTACIÓN DE ESTÁNDARES\n\nManual Práctico para Organizaciones\n\nEsta guía proporciona instrucciones paso a paso para implementar estándares de calidad en diferentes tipos de organizaciones. Incluye ejemplos prácticos, casos de estudio y herramientas útiles para facilitar el proceso de implementación.\n\nContenido de la Guía:\n• Metodología de implementación\n• Herramientas y plantillas\n• Casos de estudio reales\n• Mejores prácticas\n• Indicadores de éxito\n\nAudiencia objetivo:\n• Gerentes de calidad\n• Consultores especializados\n• Auditores internos\n• Personal de mejora continua",
        },
        {
          page: 2,
          text: "FASE 1: DIAGNÓSTICO INICIAL\n\nEvaluación del estado actual de la organización\n\nEsta fase incluye la identificación de brechas con respecto a los estándares objetivo mediante:\n\nAnálisis de Procesos:\n• Mapeo de procesos actuales\n• Identificación de entradas y salidas\n• Análisis de flujos de trabajo\n• Detección de redundancias\n• Evaluación de eficiencia\n\nEvaluación de Recursos:\n• Personal disponible y competencias\n• Infraestructura existente\n• Tecnología y sistemas\n• Recursos financieros\n• Documentación actual\n\nHerramientas recomendadas:\n• Matriz de diagnóstico GAP\n• Cuestionarios de autoevaluación\n• Entrevistas estructuradas\n• Observación directa de procesos",
        },
        {
          page: 3,
          text: "FASE 2: PLANIFICACIÓN ESTRATÉGICA\n\nDesarrollo del plan de implementación\n\nEsta fase establece el roadmap para la implementación exitosa:\n\nCronograma Detallado:\n• Hitos principales y entregables\n• Secuencia de actividades\n• Dependencias críticas\n• Recursos asignados por fase\n• Fechas de revisión y evaluación\n\nGestión de Recursos:\n• Presupuesto total y por fase\n• Asignación de personal\n• Capacitación requerida\n• Tecnología necesaria\n• Proveedores externos\n\nDefinición de Indicadores:\n• KPIs de proceso\n• Métricas de calidad\n• Indicadores financieros\n• Satisfacción del cliente\n• Criterios de éxito específicos",
        },
        {
          page: 4,
          text: "ALAMBRADO Y CERCADO PERIMETRAL\n\nMateriales necesarios para alambrado:\n• Postes de madera tratada o concreto cada 3 metros\n• Alambre galvanizado calibre 12.5\n• Grampas galvanizadas para fijación\n• Tensores y templadores\n• Aisladores para cercas eléctricas si aplica\n\nHerramientas requeridas:\n• Cavadora de hoyos\n• Martillo\n• Alicates\n• Nivel\n• Cinta métrica\n• Barreta\n\nProceso de instalación:\n1. Marcar el perímetro y ubicación de postes\n2. Cavar hoyos de 60cm de profundidad\n3. Instalar postes verificando verticalidad\n4. Tender alambre comenzando por la línea superior\n5. Tensar alambre uniformemente\n6. Fijar con grampas cada 30cm\n\nEspecificaciones técnicas:\n• Altura mínima 1.5 metros\n• Distancia entre postes máximo 3 metros\n• Tensión del alambre 150-200 kg\n• Profundidad de postes mínimo 60cm",
        },
        {
          page: 5,
          text: "MANTENIMIENTO DE ALAMBRADO\n\nInspección periódica:\n• Revisar tensión del alambre mensualmente\n• Verificar estado de postes y grampas\n• Controlar vegetación que pueda afectar la cerca\n• Reparar daños inmediatamente\n\nMateriales de repuesto recomendados:\n• Alambre galvanizado de repuesto\n• Grampas adicionales\n• Postes de reemplazo\n• Herramientas de tensado\n\nVida útil esperada:\n• Alambre galvanizado 15-20 años\n• Postes de madera tratada 10-15 años\n• Postes de concreto 25-30 años\n\nFactores que afectan durabilidad:\n• Condiciones climáticas\n• Calidad de materiales\n• Instalación correcta\n• Mantenimiento regular",
        },
      ],
    },
  ]
}

// Función mejorada para buscar en PDFs
export async function searchInPDFs(pdfs, query) {
  if (!isBrowser) {
    console.warn("Search not available in server environment")
    return []
  }
  if (!query.trim() || pdfs.length === 0) return []

  console.log(`🔍 Buscando "${query}" en ${pdfs.length} documentos...`)

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2)
  const results = []

  for (const pdf of pdfs) {
    if (!pdf.textContent) continue

    for (const pageContent of pdf.textContent) {
      const pageText = pageContent.text.toLowerCase()
      let score = 0
      let matches = 0
      let matchPositions = []

      // Buscar cada término
      for (const term of searchTerms) {
        const termMatches = (pageText.match(new RegExp(term, "g")) || []).length
        if (termMatches > 0) {
          score += termMatches
          matches += termMatches
          
          // Guardar posiciones de coincidencias
          let match
          const regex = new RegExp(term, "g")
          while ((match = regex.exec(pageText)) !== null) {
            matchPositions.push(match.index)
          }
        }
      }

      if (score > 0) {
        // Crear contexto alrededor de las coincidencias
        const contexts = matchPositions.map(pos => createContext(pageContent.text, pos, 200))
        
        results.push({
          fileName: pdf.displayName,
          page: pageContent.page,
          contexts,
          score: score / searchTerms.length,
          matches,
          fullText: pageContent.text,
          url: pdf.url,
          category: pdf.category,
          title: pdf.title
        })
      }
    }
  }

  // Ordenar por relevancia
  const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, 20)
  console.log(`✅ Encontrados ${sortedResults.length} resultados`)

  return sortedResults
}

// Función mejorada para crear contexto alrededor de una coincidencia
function createContext(text, position, contextLength = 200) {
  const start = Math.max(0, position - contextLength / 2)
  const end = Math.min(text.length, position + contextLength / 2)

  let context = text.substring(start, end)

  if (start > 0) context = "..." + context
  if (end < text.length) context = context + "..."

  return context
}

function formatFileName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, "") // Remover extensión
    .replace(/[-_]/g, " ") // Reemplazar guiones y guiones bajos
    .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalizar palabras
}

function getCategoryFromFileName(fileName) {
  const name = fileName.toLowerCase()

  if (name.includes("norma") || name.includes("iso")) return "normativo"
  if (name.includes("procedimiento")) return "procedimiento"
  if (name.includes("guia") || name.includes("manual")) return "guía"
  if (name.includes("tecnico")) return "técnico"

  return "documento"
}
