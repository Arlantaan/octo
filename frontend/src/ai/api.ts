import { API_BASE_URL } from '../config/api'

export type ChatRole = 'user' | 'assistant'
export interface ChatTurn {
  role: ChatRole
  content: string
}

export interface AIUsage {
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  cost_usd: number
  latency_ms: number
}

export interface ProjectBrief {
  title: string
  summary: string
  who: string
  what: string
  when: string
  where: string
  why: string
  recommended_services: string[]
  relevant_experience: string
  questions_to_clarify: string[]
  next_step: string
}

export interface AIStatus {
  available: boolean
  reason: 'not_configured' | 'budget' | null
  model: string
}

const AI_BASE = `${API_BASE_URL}/ai`

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.detail === 'string') return body.detail
  } catch {
    /* not JSON */
  }
  return res.status === 429 ? 'Too many messages. Please wait a little.' : 'The AI demo is unavailable right now.'
}

export async function getStatus(): Promise<AIStatus> {
  try {
    const res = await fetch(`${AI_BASE}/status`)
    if (!res.ok) throw new Error()
    return (await res.json()) as AIStatus
  } catch {
    return { available: false, reason: null, model: '' }
  }
}

/**
 * Send the conversation and stream the reply.
 * The backend answers with server-sent events: {type:'text'|'done'|'error', ...}.
 */
export async function streamChat(
  messages: ChatTurn[],
  handlers: { onText: (t: string) => void; onDone: (u: AIUsage) => void; onError: (msg: string) => void },
  signal?: AbortSignal,
): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${AI_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    })
  } catch {
    if (!signal?.aborted) handlers.onError("Couldn't reach the server. Please try again.")
    return
  }
  if (!res.ok || !res.body) {
    handlers.onError(await errorMessage(res))
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const line = frame.split('\n').find((l) => l.startsWith('data: '))
        if (!line) continue
        const event = JSON.parse(line.slice(6))
        if (event.type === 'text') handlers.onText(event.text)
        else if (event.type === 'done') handlers.onDone(event.usage)
        else if (event.type === 'error') handlers.onError(event.message)
      }
    }
  } catch {
    if (!signal?.aborted) handlers.onError('The connection dropped. Please try again.')
  }
}

export async function scopeProject(
  problem: string,
): Promise<{ brief: ProjectBrief | null; message: string | null; usage: AIUsage | null }> {
  try {
    const res = await fetch(`${AI_BASE}/scope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem }),
    })
    if (!res.ok) return { brief: null, message: await errorMessage(res), usage: null }
    return await res.json()
  } catch {
    return { brief: null, message: "Couldn't reach the server. Please try again.", usage: null }
  }
}

/** Open the floating assistant from anywhere (optionally with a first question). */
export function openOcto(question?: string): void {
  window.dispatchEvent(new CustomEvent('octo:open', { detail: { question } }))
}
