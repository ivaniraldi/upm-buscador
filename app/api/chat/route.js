export async function POST(request) {
  try {
    const { prompt } = await request.json()

    // Configuración de OpenRouter
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "sk-or-v1-tu-api-key-aqui") {
      return Response.json(
        {
          error: "API Key no configurada. Configura OPENROUTER_API_KEY en las variables de entorno.",
          fallbackResponse:
            "Disculpa, el servicio de IA no está disponible en este momento. Sin embargo, puedes navegar por los documentos usando los enlaces de búsqueda y el visor de documentos.",
        },
        { status: 400 },
      )
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://buscador-estandares.vercel.app",
        "X-Title": "Buscador de Estándares",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente especializado en documentos técnicos y estándares. Responde siempre en español de manera clara, concisa y profesional. Incluye referencias específicas a páginas de documentos cuando sea relevante. Limita tu respuesta a la información proporcionada en el contexto.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      }),
    })

    if (!response.ok) {
      console.error(`OpenRouter API error: ${response.status}`)
      return Response.json({
        response:
          "El servicio de IA no está disponible temporalmente. Sin embargo, puedes usar la función de búsqueda para encontrar información específica en los documentos cargados y navegar directamente a las páginas relevantes.",
        fallback: true,
      })
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || "No se pudo generar una respuesta completa."

    const cleanedResponse = aiResponse
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      .trim()

    return Response.json({ response: cleanedResponse })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({
      response:
        "Ocurrió un error temporal con el servicio de IA. Mientras tanto, puedes usar la búsqueda avanzada y el visor de documentos para encontrar la información que necesitas. Los enlaces en los resultados de búsqueda te llevarán directamente a las páginas relevantes de los documentos.",
      fallback: true,
    })
  }
}
