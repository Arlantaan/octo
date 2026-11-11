/**
 * Octo's voice.
 *  - Speaking: Abdulla's cloned voice (ElevenLabs, via our backend /api/ai/speak). There is no robot
 *    fallback: if the clone isn't configured or fails, Octo simply stays silent and answers in text.
 *  - Greeting: Abdulla's own recorded welcome clip.
 *  - Listening: the browser's SpeechRecognition (free, on-device/browser service).
 */

import { API_BASE_URL } from '../config/api'

// ---------- Listening (speech-to-text) ----------

interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionAlternative; length: number }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type RecognitionCtor = new () => Recognition

const RecognitionImpl: RecognitionCtor | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as { SpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
       (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition)
    : undefined

export const canListen = Boolean(RecognitionImpl)

export interface ListenHandlers {
  onInterim: (text: string) => void
  onFinal: (text: string) => void
  onError: (message: string) => void
  onEnd: () => void
}

/** Start listening once; returns a stop function. */
export function listen(h: ListenHandlers): () => void {
  if (!RecognitionImpl) {
    h.onError("Voice input isn't supported in this browser. Try Chrome, Edge or Safari, or type instead.")
    h.onEnd()
    return () => {}
  }
  stopSpeaking() // don't let Octo hear itself
  const rec = new RecognitionImpl()
  rec.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US'
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1
  let finalText = ''
  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript
      else interim += r[0].transcript
    }
    h.onInterim((finalText + interim).trim())
  }
  rec.onerror = (e) => {
    const messages: Record<string, string> = {
      'not-allowed': 'Microphone access was blocked. Click the mic icon in the address bar to allow it, or type instead.',
      'service-not-allowed': "This browser doesn't allow voice input here. Try Chrome or Edge, or type instead.",
      'no-speech': "I didn't catch that. Tap the mic and try again.",
      'audio-capture': 'No microphone was found. Check one is connected, or type instead.',
      network: "Voice input couldn't reach your browser's speech service. Check your internet connection, or type instead.",
      'language-not-supported': "Voice input doesn't support your language setting yet. Please type instead.",
    }
    if (e.error === 'aborted') return
    h.onError(messages[e.error] ?? `Voice input stopped (${e.error}). You can type instead.`)
  }
  rec.onend = () => {
    if (finalText.trim()) h.onFinal(finalText.trim())
    h.onEnd()
  }
  rec.start()
  return () => rec.stop()
}

// ---------- Mute preference (voice on by default when the clone is configured) ----------

const MUTE_KEY = 'octo-voice-muted-v2'
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}
export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* preference just won't persist */
  }
}

// ---------- Abdulla's recorded greeting ----------

/** Abdulla's own recorded welcome (AAC/.m4a plays in every modern browser). */
export const GREETING_URL = '/audio/welcome.m4a'

let greetingAvailable: Promise<boolean> | null = null

export function hasGreeting(): Promise<boolean> {
  if (!greetingAvailable) {
    greetingAvailable = fetch(GREETING_URL, { method: 'HEAD' })
      .then((r) => r.ok && (r.headers.get('content-type') ?? '').startsWith('audio'))
      .catch(() => false)
  }
  return greetingAvailable
}

let greetingAudio: HTMLAudioElement | null = null

/** Play the recorded greeting (call from a click). onEnd always runs, even with no recording. */
export function playGreeting(onEnd: () => void): void {
  hasGreeting().then((ok) => {
    if (!ok) return onEnd()
    greetingAudio?.pause()
    const audio = new Audio(GREETING_URL)
    greetingAudio = audio
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onEnd()
    }
    audio.onended = finish
    audio.onerror = finish
    audio.play().catch(finish)
  })
}

// ---------- Speaking in the cloned voice ----------

/** Turn chat text into something that sounds natural when read aloud. */
export function toSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/\/ai-lab\b/g, 'the AI Lab page')
    .replace(/\/ai-engineering\b/g, 'the AI Engineering and Software Development page')
    .replace(/\/(about|services|portfolio|partners|contact|quote)\b/g, 'the $1 page')
    .replace(/abdulla@octopustech\.org/g, 'abdulla at octopus tech dot org')
    .replace(/\b([a-z0-9-]+)\.com\b/gi, '$1 dot com')
    .replace(/OctopusTech/g, 'Octopus Tech')
    .replace(/\s+/g, ' ')
    .trim()
}

const MAX_SPOKEN_CHARS = 380 // keep each request under the backend's per-request cap

/** Split long sentences at commas/semicolons (or hard-wrap) so each request stays small. */
function splitLong(text: string): string[] {
  if (text.length <= MAX_SPOKEN_CHARS) return [text]
  const parts: string[] = []
  let current = ''
  for (const piece of text.split(/(?<=[,;:])\s+/)) {
    if ((current + ' ' + piece).trim().length > MAX_SPOKEN_CHARS && current) {
      parts.push(current.trim())
      current = piece
    } else {
      current = (current + ' ' + piece).trim()
    }
  }
  if (current) parts.push(current.trim())
  return parts.flatMap((p) => (p.length <= MAX_SPOKEN_CHARS ? [p] : p.match(new RegExp(`.{1,${MAX_SPOKEN_CHARS}}(\\s|$)`, 'g')) ?? [p]))
}

/**
 * Speaks a streaming reply in Abdulla's cloned voice, sentence by sentence.
 * Fetches the next sentence's audio while the current one plays, so speech flows without gaps.
 */
export class VoiceQueue {
  private buffer = ''
  private pending: string[] = []
  private nextAudio: Promise<string | null> | null = null
  private playing: HTMLAudioElement | null = null
  private active = false
  private disabled = false
  private aborter = new AbortController()

  constructor(private enabled: () => boolean, private onState?: (speaking: boolean) => void) {}

  /** Feed streamed text; complete sentences are queued for speech. */
  push(chunk: string): void {
    this.buffer += chunk
    const complete = this.buffer.match(/^[\s\S]*[.!?\n](?=\s)/)
    if (!complete) return
    this.buffer = this.buffer.slice(complete[0].length)
    this.enqueue(complete[0])
  }

  /** The reply finished: speak whatever is left. */
  flush(): void {
    if (this.buffer.trim()) this.enqueue(this.buffer)
    this.buffer = ''
  }

  stop(): void {
    this.aborter.abort()
    this.aborter = new AbortController()
    this.pending = []
    this.buffer = ''
    this.nextAudio = null
    this.playing?.pause()
    this.playing = null
    this.setActive(false)
  }

  private enqueue(text: string): void {
    if (this.disabled || !this.enabled()) return
    const spoken = toSpeech(text)
    if (!spoken) return
    this.pending.push(...splitLong(spoken))
    if (!this.active) this.playNext()
  }

  private fetchAudio(text: string): Promise<string | null> {
    return fetch(`${API_BASE_URL}/ai/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: this.aborter.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          // Limit reached or voice unavailable: stay silent for the rest of this visit
          if (res.status === 429 || res.status === 502 || res.status === 503) this.disabled = true
          return null
        }
        return URL.createObjectURL(await res.blob())
      })
      .catch(() => null)
  }

  private setActive(on: boolean) {
    this.active = on
    this.onState?.(on)
  }

  private async playNext(): Promise<void> {
    if (!this.enabled() || this.disabled) return this.stop()

    // 1. The clip to play now: the one prefetched last round, or fetch the next sentence
    let clip = this.nextAudio
    this.nextAudio = null
    if (!clip) {
      const text = this.pending.shift()
      if (text === undefined) return this.setActive(false) // nothing left to say
      clip = this.fetchAudio(text)
    }
    this.setActive(true)

    // 2. Start fetching the sentence after it, so it's ready when this one ends
    const following = this.pending.shift()
    if (following !== undefined) this.nextAudio = this.fetchAudio(following)

    // 3. Play it (skip silently if that sentence failed)
    const url = await clip
    if (!url) return this.playNext()
    const audio = new Audio(url)
    this.playing = audio
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
    URL.revokeObjectURL(url)
    if (this.playing === audio) this.playing = null
    this.playNext()
  }
}

// One shared queue, so starting to listen can silence whatever Octo is saying
let activeQueue: VoiceQueue | null = null
export function registerQueue(q: VoiceQueue): void {
  activeQueue = q
}

export function stopSpeaking(): void {
  greetingAudio?.pause()
  greetingAudio = null
  activeQueue?.stop()
}
