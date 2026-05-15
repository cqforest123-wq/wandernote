import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, maxTokens, responseMimeType } = await req.json()

    if (!prompt || !String(prompt).trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service is not configured' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: Math.min(Math.max(maxTokens ?? 4096, 4096), 12000),
            temperature: 0.2,
            thinkingConfig: {
              thinkingBudget: 0,
            },
            ...(responseMimeType ? { responseMimeType } : {}),
          },
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'AI request failed' }),
        { status: res.status, headers: corsHeaders }
      )
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Empty AI response' }),
        { status: 502, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ content: [{ type: 'text', text }] }),
      { headers: corsHeaders }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e?.message || 'Unexpected AI proxy error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
