/**
 * Browser-native voice for Octo: text-to-speech (speechSynthesis) and speech-to-text (SpeechRecognition).
 * Free, runs on the visitor's device, no extra API calls. Both degrade gracefully when unsupported
 * (e.g. Firefox has no SpeechRecognition): the chat simply stays text-only.
 */

// Minimal typings for the Web Speech recognition API (not in TypeScript's DOM lib everywhere)
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

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
export const canListen = Boolean(RecognitionImpl)

const MUTE_KEY = 'octo-voice-muted'
/** Spoken replies use the browser's built-in voice, so they're off unless the visitor turns them on. */
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) !== '0'
  } catch {
    return true
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

/** Check once whether the recording exists, so a missing file never causes a delay or an error. */
export function hasGreeting(): Promise<boolean> {
  if (!greetingAvailable) {
    greetingAvailable = fetch(GREETING_URL, { method: 'HEAD' })
      .then((r) => r.ok && (r.headers.get('content-type') ?? '').startsWith('audio'))
      .catch(() => false)
  }
  return greetingAvailable
}

let greetingAudio: HTMLAudioElement | null = null

/**
 * Play the recorded greeting. Must be called from a click (browsers block audio otherwise).
 * Calls onEnd when it finishes, fails, or there is no recording, so the next step always runs.
 */
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

export function stopGreeting(): void {
  greetingAudio?.pause()
  greetingAudio = null
}

// ---------- Speaking (browser voice, opt-in) ----------

let chosenVoice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  if (!canSpeak) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const pool = english.length ? english : voices
  // Prefer the higher-quality neural voices most browsers now ship
  const rank = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 4 : 0) +
    (/google|microsoft|samantha|daniel/i.test(v.name) ? 2 : 0) +
    (/en-(gb|us)/i.test(v.lang) ? 1 : 0)
  return [...pool].sort((a, b) => rank(b) - rank(a))[0] ?? null
}

if (canSpeak) {
  chosenVoice = pickVoice()
  window.speechSynthesis.onvoiceschanged = () => {
    chosenVoice = pickVoice()
  }
}

/** Turn chat text into something that sounds natural when read aloud. */
export function toSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/\/ai-lab\b/g, 'the AI Lab page')
    .replace(/\/(about|services|portfolio|partners|contact|quote)\b/g, 'the $1 page')
    .replace(/abdulla@octopustech\.org/g, 'abdulla at octopus tech dot org')
    .replace(/\b([a-z0-9-]+)\.com\b/gi, '$1 dot com')
    .replace(/OctopusTech/g, 'Octopus Tech')
    .replace(/\s+/g, ' ')
    .trim()
}

export function speak(text: string, onEnd?: () => void): void {
  if (!canSpeak) return
  const said = toSpeech(text)
  if (!said) return
  const u = new SpeechSynthesisUtterance(said)
  if (chosenVoice) u.voice = chosenVoice
  u.lang = chosenVoice?.lang ?? 'en-GB'
  u.rate = 1.02
  u.pitch = 1
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.speak(u) // queued after anything already speaking
}

export function stopSpeaking(): void {
  stopGreeting()
  if (canSpeak) window.speechSynthesis.cancel()
}

/**
 * Speaks a streaming reply sentence by sentence, so Octo starts talking while the
 * rest of the answer is still arriving.
 */
export class SentenceSpeaker {
  private buffer = ''
  constructor(private enabled: () => boolean) {}

  push(chunk: string): void {
    this.buffer += chunk
    // Speak everything up to the last complete sentence: a . ! ? or line break that is
    // followed by whitespace (so "koyagambia.com" or "3.5" isn't cut mid-word).
    const complete = this.buffer.match(/^[\s\S]*[.!?\n](?=\s)/)
    if (!complete) return
    this.buffer = this.buffer.slice(complete[0].length)
    if (this.enabled()) speak(complete[0])
  }

  flush(): void {
    if (this.buffer.trim() && this.enabled()) speak(this.buffer)
    this.buffer = ''
  }

  reset(): void {
    this.buffer = ''
  }
}

// ---------- Listening ----------

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
