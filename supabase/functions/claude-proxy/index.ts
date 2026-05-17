import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: corsHeaders }
  )
}

function clampMaxTokens(maxTokens: number | undefined) {
  return Math.min(Math.max(maxTokens ?? 4096, 4096), 12000)
}

function pickProvider(region?: string) {
  const normalizedRegion = String(region || 'global').toLowerCase()

  if (normalizedRegion === 'cn') {
    return Deno.env.get('AI_PROVIDER_CN') || 'gemini'
  }

  return Deno.env.get('AI_PROVIDER_GLOBAL') || 'gemini'
}

async function callGemini({
  prompt,
  maxTokens,
  responseMimeType,
}: {
  prompt: string
  maxTokens?: number
  responseMimeType?: string
}) {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

  if (!apiKey) {
    return jsonResponse({ error: 'AI service is not configured' }, 500)
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: clampMaxTokens(maxTokens),
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
    return jsonResponse(
      { error: data.error?.message || 'AI request failed' },
      res.status
    )
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!text) {
    return jsonResponse({ error: 'Empty AI response' }, 502)
  }

  return jsonResponse({
    content: [{ type: 'text', text }],
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      prompt,
      maxTokens,
      responseMimeType,
      region,
      task,
    } = await req.json()

    if (!prompt || !String(prompt).trim()) {
      return jsonResponse({ error: 'Missing prompt' }, 400)
    }

    const provider = pickProvider(region)

    // Router scaffold.
    // Current supported provider remains Gemini.
    // Future domestic providers can be added here:
    // - deepseek
    // - qwen
    // - zhipu
    // - doubao
    if (provider === 'gemini') {
      return await callGemini({
        prompt,
        maxTokens,
        responseMimeType,
      })
    }

    return jsonResponse(
      {
        error: `AI provider is not supported yet: ${provider}`,
        region: region || 'global',
        task: task || 'unknown',
      },
      501
    )
  } catch (e) {
    return jsonResponse(
      { error: e?.message || 'Unexpected AI proxy error' },
      500
    )
  }
})
