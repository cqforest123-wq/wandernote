import { supabase } from './supabase';

export async function callClaude(prompt, maxTokens = 1000) {
  if (!prompt || !String(prompt).trim()) {
    throw new Error('Empty prompt');
  }

  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: {
      prompt,
      maxTokens,
    },
  });

  if (error) {
    throw new Error(error.message || 'AI request failed');
  }

  const text = data?.content?.[0]?.text || '';

  if (!text) {
    throw new Error('Empty AI response');
  }

  return text;
}
