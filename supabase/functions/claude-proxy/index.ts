import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    }})
  }

  const { prompt, maxTokens } = await req.json()
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens ?? 1000,
          temperature: 0.3,
        },
      }),
    }
  )

  const data = await res.json()
  console.log('status:', res.status, 'error:', data.error?.message ?? 'none')

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  console.log('text length:', text.length, 'first 100:', text.slice(0,100))
  const result = { content: [{ type: 'text', text }] }

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
