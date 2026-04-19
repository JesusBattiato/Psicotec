import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { text, field } = body
    console.log(`Petición recibida para campo: ${field}. Texto: "${text?.substring(0, 20)}..."`)

    if (!GROQ_API_KEY) {
      console.error("ERROR: No se encontró la variable GROQ_API_KEY.")
      return new Response(JSON.stringify({ error: 'Configuración incompleta: Falta API Key en Supabase' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!text || text.length < 5) {
      return new Response(JSON.stringify({ error: 'Texto demasiado corto para optimizar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const systemPrompt = `Eres un experto en Selección de Personal y Redacción Curricular de la consultora Psicotec. 
    Tu tarea es profesionalizar el texto de un candidato para su CV. 
    - Usa un lenguaje ejecutivo, elegante y directo. 
    - Enfócate en verbos de acción y logros.
    - Mantén una extensión similar al original pero mejora la calidad.
    - Idioma: Español (Argentina/Latinoamérica).
    - IMPORTANTE: Devuelve SOLO el texto mejorado, sin introducciones ni comentarios adicionales.`

    const userPrompt = field === 'resumen' 
      ? `Mejora este resumen profesional de CV: "${text}"`
      : `Profesionaliza esta descripción de tareas laborales: "${text}"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Error de Groq:", data)
      return new Response(JSON.stringify({ 
        error: `Error de la IA (${response.status}): ${data.error?.message || 'Error desconocido'}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const improvedText = data.choices?.[0]?.message?.content?.trim()?.replace(/^"|"$/g, '')
    
    if (!improvedText) {
       throw new Error("La IA no devolvió ningún contenido válido.")
    }

    return new Response(JSON.stringify({ improvedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
