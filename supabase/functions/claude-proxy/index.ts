import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Content-Type': 'application/json',
}

type ProxyImage = {
  mimeType?: string
  mime_type?: string
  data?: string
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

function normalizeImages(images: unknown): { mimeType: string; data: string }[] {
  if (!Array.isArray(images)) return []

  return images
    .slice(0, 6)
    .map((item) => {
      const image = item as ProxyImage
      const mimeType = image.mimeType || image.mime_type || 'image/jpeg'
      const data = String(image.data || '').trim()

      return {
        mimeType,
        data,
      }
    })
    .filter((image) => image.data && image.mimeType.startsWith('image/'))
}

async function callGemini({
  prompt,
  maxTokens,
  responseMimeType,
  images,
}: {
  prompt: string
  maxTokens?: number
  responseMimeType?: string
  images?: { mimeType: string; data: string }[]
}) {
  const apiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

  if (!apiKey) {
    return jsonResponse({ error: 'AI service is not configured' }, 500)
  }

  const parts = [
    { text: prompt },
    ...((images || []).map((image) => ({
      inline_data: {
        mime_type: image.mimeType,
        data: image.data,
      },
    }))),
  ]

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
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

async function callDeepSeek({
  prompt,
  maxTokens,
  responseMimeType,
}: {
  prompt: string
  maxTokens?: number
  responseMimeType?: string
}) {
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY') ?? ''
  const model = Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-v4-flash'

  if (!apiKey) {
    return jsonResponse({ error: 'DeepSeek API key is not configured' }, 500)
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: clampMaxTokens(maxTokens),
      temperature: 0.2,
      thinking: {
        type: 'disabled',
      },
      ...(responseMimeType === 'application/json'
        ? { response_format: { type: 'json_object' } }
        : {}),
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return jsonResponse(
      { error: data.error?.message || 'DeepSeek request failed' },
      res.status
    )
  }

  const text = data.choices?.[0]?.message?.content ?? ''

  if (!text) {
    return jsonResponse({ error: 'Empty DeepSeek response' }, 502)
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
      images,
    } = await req.json()

    if (!prompt || !String(prompt).trim()) {
      return jsonResponse({ error: 'Missing prompt' }, 400)
    }

    const normalizedImages = normalizeImages(images)
    const provider = pickProvider(region)

    if (normalizedImages.length > 0 && provider !== 'gemini') {
      return jsonResponse(
        {
          error: 'Image input currently requires Gemini provider',
          provider,
          region: region || 'global',
          task: task || 'unknown',
        },
        400
      )
    }

    if (provider === 'gemini') {
      return await callGemini({
        prompt,
        maxTokens,
        responseMimeType,
        images: normalizedImages,
      })
    }

    if (provider === 'deepseek') {
      return await callDeepSeek({
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
