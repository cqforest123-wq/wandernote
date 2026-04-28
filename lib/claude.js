import { supabase } from './supabase';

export async function callClaude(prompt, maxTokens = 1000) {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { prompt, maxTokens },
  })
  if (error) throw new Error(error.message)
  if (data.error) throw new Error(data.error.message)
  return data.content?.map(b => b.text || '').join('') || ''
}
