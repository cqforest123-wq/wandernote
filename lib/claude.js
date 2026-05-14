import { supabase } from './supabase';

export async function callClaude(prompt, maxTokens = 1000) {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { prompt, maxTokens },
  })
  console.log('supabase error:', error?.message)
  console.log('data keys:', data ? Object.keys(data) : 'null')
  if (error) throw new Error(error.message)
  if (data.error) throw new Error(data.error.message)
  return data.content?.map(b => b.text || '').join('') || ''
}
