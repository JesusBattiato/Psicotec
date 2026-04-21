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
    const { text, field, imageBase64 } = body
    console.log(`Petición recibida para campo: ${field}. Texto: "${text?.substring(0, 20)}..." | Imagen adjunta: ${!!imageBase64}`)

    if (!GROQ_API_KEY) {
      console.error("ERROR: No se encontró la variable GROQ_API_KEY.")
      return new Response(JSON.stringify({ error: 'Configuración incompleta: Falta API Key en Supabase' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    if (!text && !imageBase64) {
      return new Response(JSON.stringify({ error: 'Falta contenido (texto o imagen) para procesar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const VISION_MODELS = [
      Deno.env.get('GROQ_VISION_MODEL'),
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'llama-4-scout-17b-16e-instruct',
      'llama-3.2-11b-vision',
      'llama-3.2-90b-vision',
      'meta-llama/llama-3.2-11b-vision-instruct',
      'meta-llama/llama-3.2-90b-vision-instruct',
      'llama-3.2-11b-vision-instruct',
      'llama-3.2-90b-vision-instruct',
      'llama-3.2-11b-vision-preview',
      'llama-3.2-90b-vision-preview'
    ].filter(Boolean);

    let modelsToTry = imageBase64 ? VISION_MODELS : ['llama-3.1-8b-instant'];

    let systemPrompt = `Eres un experto en Selección de Personal y Redacción Curricular de la consultora Psicotec. 
    Tu tarea es profesionalizar el texto de un candidato para su CV. 
    - Idioma: Español (Argentina/Latinoamérica).
    - IMPORTANTE: Devuelve SOLO el texto u output solicitado, sin introducciones ni comentarios adicionales.`;

    let userPromptContent: any[] = [];
    
    if (field === 'autofill') {
      systemPrompt += `\nDevuelve la respuesta ESTRICTAMENTE en formato JSON plano usando esta estructura exacta extrayendo los datos del texto o imagen provista (asegúrate de que sea JSON válido, sin corchetes de markdown \`\`\`json al inicio, solo las llaves {}):
      {
        "nombre": "", "apellido": "", "email": "", "tel": "", "birth_date": "", "ciudad": "", "provincia": "", 
        "linkedin": "", "titulo": "", "resumen": "", "puesto": "", "modalidad": "", "disp": "", "reloc": "",
        "edu1tit": "", "edu1niv": "", "edu1inst": "", "edu1anio": "",
        "edu2tit": "", "edu2inst": "", "edu2anio": "",
        "skillsh": "", "skillss": "", "idiomas": "",
        "experiencias": [
          { "emp": "", "cargo": "", "desde": "", "hasta": "", "desc": "" }
        ]
      }`;
      userPromptContent.push({ type: 'text', text: `Extrae de forma exhaustiva la información del CV provisto y estructúrala en el JSON solicitado.\nTexto del CV:\n${text || 'Analiza el documento/imagen adjunta.'}` });
    } else if (field === 'resumen') {
      systemPrompt += `\nESTRICTAMENTE: Tu objetivo final es reescribir y mejorar el texto original del candidato. NO transcribas la captura de la oferta de trabajo. Usa la imagen de la oferta SOLO como guía estratégica para saber qué palabras clave o competencias priorizar en la reescritura del CV.`;
      userPromptContent.push({ type: 'text', text: `Reescribe y mejora este resumen profesional del candidato usando lenguaje ejecutivo y orientado a logros. Si hay una imagen de oferta laboral adjunta, haz que el resumen resalte sutilmente por qué el candidato es ideal para ese puesto. Texto del candidato: "${text || '(Candidato en blanco - redacta un borrador genérico enfocado al puesto de la imagen)'}"` });
    } else if (field === 'skills') {
      systemPrompt += `\nESTRICTAMENTE: NO transcribas la captura de la oferta. Extrae o genera habilidades basadas en el perfil, y si hay oferta adjunta, prioriza extraer y listar las palabras clave exactas que pide la empresa.`;
      userPromptContent.push({ type: 'text', text: `Listado de habilidades técnicas o blandas para el CV. Si hay oferta adjunta, alinéalas con lo que piden. Texto del candidato: "${text}". Devuelve SOLO una lista separada por COMAS. Máximo 15.` });
    } else {
      systemPrompt += `\nESTRICTAMENTE: NO transcribas la imagen de la oferta. Reescribe la descripción de experiencia del candidato orientándola al puesto vacante. Usa los mismos verbos y terminología de la oferta si es posible.`;
      userPromptContent.push({ type: 'text', text: `Profesionaliza esta experiencia laboral con verbos de acción. Si hay oferta adjunta, haz match destacando sutilmente las responsabilidades que pide la oferta. Texto original: "${text}"` });
    }

    if (imageBase64) {
      userPromptContent.push({
        type: 'image_url',
        // Asegurar que imageBase64 mande el formato data URL correcto (ej: data:image/jpeg;base64,...)
        image_url: { url: imageBase64 }
      });
    }

    let response, data;
    for (const model of modelsToTry) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPromptContent }
          ],
          temperature: field === 'autofill' ? 0.1 : 0.7,
          max_tokens: field === 'autofill' ? 2500 : 800,
        }),
      });

      data = await response.json();

      if (response.ok) {
        break; // Éxito, salir del bucle
      } else if (data?.error?.message?.includes('decommissioned') || data?.error?.message?.includes('does not exist')) {
        console.warn(`Modelo ${model} discontinuado o inexistente. Intentando con el siguiente...`);
        continue;
      } else {
        break; // Es otro tipo de error (auth, payload size, etc.) - no tiene sentido reintentar
      }
    }

    if (!response || !response.ok) {
      console.error("Error definitivo de Groq:", data)
      return new Response(JSON.stringify({ 
        error: `Error de la IA (${response?.status || 500}): ${data?.error?.message || 'Error desconocido'}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let improvedText = data.choices?.[0]?.message?.content?.trim()
    
    if (improvedText) {
      // Limpiar prefijos de markdown json por si el LLM los pone a pesar del prompt
      improvedText = improvedText.replace(/^```json/i, '').replace(/```$/i, '').trim()
    } else {
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
