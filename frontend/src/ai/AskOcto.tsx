import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getStatus, streamChat, type AIStatus, type AIUsage, type ChatTurn } from './api'
import RichText from './RichText'
import UnderTheHood from './UnderTheHood'
import { canListen, listen, loadMuted, playGreeting, registerQueue, saveMuted, stopSpeaking, VoiceQueue } from './voice'

const MAX_CHARS = 800
const STORE_KEY = 'octo-chat-v1'
const GREETED_KEY = 'octo-greeted'
const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]

const WELCOME =
  "Hi, welcome to OctopusTech! I'm Octo, Abdulla's AI assistant. Ask me about his work, or tell me about your project and I'll help you out."

const SUGGESTIONS = [
  'What has Abdulla built?',
  'Can he help my restaurant get online?',
  'How would he scope a new app idea?',
  'Is he open to joining a team?',
]

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* storage unavailable: features still work for this page view */
  }
}

function loadHistory(): ChatTurn[] {
  try {
    const parsed = JSON.parse(readSession(STORE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const AskOcto = () => {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<ChatTurn[]>(loadHistory)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<AIUsage | null>(null)
  const [showHood, setShowHood] = useState(false)
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [showGreeting, setShowGreeting] = useState(false)
  const [muted, setMuted] = useState(loadMuted)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  // True after speech is transcribed and is waiting for the visitor to confirm and send
  const [reviewing, setReviewing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const stopListenRef = useRef<(() => void) | null>(null)
  const mutedRef = useRef(muted)
  const greetingPlayingRef = useRef(false)
  const statusRef = useRef<AIStatus | null>(null)
  useEffect(() => {
    statusRef.current = status
  }, [status])
  // Speaks replies in Abdulla's cloned voice; silent unless the clone is configured on the server
  const speakerRef = useRef<VoiceQueue | null>(null)
  if (!speakerRef.current) {
    speakerRef.current = new VoiceQueue(
      () => Boolean(statusRef.current?.voice) && !mutedRef.current,
      (on) => setSpeaking(on || greetingPlayingRef.current),
    )
    registerQueue(speakerRef.current)
  }

  useEffect(() => {
    mutedRef.current = muted
    saveMuted(muted)
    if (muted) stopSpeaking()
  }, [muted])

  useEffect(() => writeSession(STORE_KEY, JSON.stringify(turns.slice(-24))), [turns])

  // Friendly greeting bubble, once per visit, ~1.6s (φ) after the page loads
  useEffect(() => {
    if (readSession(GREETED_KEY)) return
    const t = setTimeout(() => setShowGreeting(true), 1618)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open && !status) getStatus().then(setStatus)
    if (open) setShowGreeting(false)
  }, [open, status])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, busy])

  const close = useCallback(() => {
    setOpen(false)
    stopSpeaking()
    stopListenRef.current?.()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const send = useCallback(
    async (text: string) => {
      const question = text.trim()
      if (!question || busy) return
      setError('')
      setInput('')
      setReviewing(false)
      stopSpeaking()
      const history: ChatTurn[] = [...turns, { role: 'user', content: question }]
      setTurns([...history, { role: 'assistant', content: '' }])
      setBusy(true)
      abortRef.current = new AbortController()

      await streamChat(
        history,
        {
          onText: (t) => {
            speakerRef.current?.push(t)
            setTurns((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              next[next.length - 1] = { ...last, content: last.content + t }
              return next
            })
          },
          onDone: (u) => {
            speakerRef.current?.flush()
            setUsage(u)
          },
          onError: (msg) => {
            setError(msg)
            setTurns((prev) => (prev[prev.length - 1]?.content ? prev : prev.slice(0, -1)))
          },
        },
        abortRef.current.signal,
      )
      setBusy(false)
    },
    [busy, turns],
  )

  const startListening = useCallback(() => {
    if (!canListen || listening) return
    setError('')
    setListening(true)
    setReviewing(false)
    // Anything already typed is kept; speech is appended after it
    const typedBefore = inputRef.current?.value.trim() ?? ''
    const join = (t: string) => (typedBefore ? `${typedBefore} ${t}` : t)
    stopListenRef.current = listen({
      onInterim: (t) => setInput(join(t)),
      // Never auto-send: place the transcript in the box for the visitor to check, edit and send
      onFinal: (t) => {
        setInput(join(t))
        setReviewing(true)
        setTimeout(() => {
          const el = inputRef.current
          if (el) {
            el.focus()
            el.setSelectionRange(el.value.length, el.value.length)
          }
        }, 0)
      },
      onError: (m) => setError(m),
      onEnd: () => {
        setListening(false)
        stopListenRef.current = null
      },
    })
  }, [listening, send])

  /** Open the panel. The click counts as the user gesture browsers require before audio can play. */
  const openPanel = useCallback(
    (opts: { greetAloud?: boolean; thenListen?: boolean } = {}) => {
      setOpen(true)
      setShowGreeting(false)
      writeSession(GREETED_KEY, '1')
      // Only listen when Octo can actually answer; otherwise the offline note explains why
      const listenIfAvailable = () => {
        if (!opts.thenListen) return
        const check = statusRef.current ? Promise.resolve(statusRef.current) : getStatus().then((s) => (setStatus(s), s))
        check.then((s) => s.available && startListening())
      }
      if (opts.greetAloud) {
        // Abdulla's own recorded welcome (falls straight through if there's no recording yet)
        greetingPlayingRef.current = true
        setSpeaking(true)
        playGreeting(() => {
          greetingPlayingRef.current = false
          setSpeaking(false)
          listenIfAvailable()
        })
      } else {
        listenIfAvailable()
      }
      setTimeout(() => inputRef.current?.focus(), 300)
    },
    [startListening],
  )

  // Other parts of the site (e.g. the AI Lab page) can open the assistant with a question
  useEffect(() => {
    const onOpen = (e: Event) => {
      openPanel({ greetAloud: false })
      const q = (e as CustomEvent<{ question?: string }>).detail?.question
      if (q) setTimeout(() => send(q), 350)
    }
    window.addEventListener('octo:open', onOpen)
    return () => window.removeEventListener('octo:open', onOpen)
  }, [openPanel, send])

  const reset = () => {
    abortRef.current?.abort()
    stopSpeaking()
    setTurns([])
    setUsage(null)
    setError('')
    setBusy(false)
  }

  const dismissGreeting = () => {
    setShowGreeting(false)
    writeSession(GREETED_KEY, '1')
  }

  const unavailable = status !== null && !status.available
  const offlineNote =
    status?.reason === 'budget'
      ? 'The AI demo has used its budget for now. Please reach out via /contact.'
      : 'The AI demo is offline right now. You can still reach Abdulla via /contact.'
  const stateLabel = listening ? 'Listening…' : speaking ? 'Speaking…' : 'AI assistant'

  return (
    <>
      {/* Greeting bubble */}
      <AnimatePresence>
        {showGreeting && !open && (
          <motion.div
            key="octo-greet"
            className="octo-greet"
            role="dialog"
            aria-label="Octo says hello"
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.618, ease: EASE_PHI } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.236 } }}
          >
            <button className="octo-greet-close" onClick={dismissGreeting} aria-label="Dismiss greeting">
              <i className="fas fa-xmark" />
            </button>
            <div className="flex items-start gap-2.5">
              <span className="octo-avatar shrink-0" aria-hidden="true">
                <i className="fas fa-wand-magic-sparkles" />
              </span>
              <div>
                <div className="font-semibold text-white">Hi, welcome to OctopusTech!</div>
                <p className="text-sm text-white/70 mt-0.5">I'm Octo. Can I help you find something, or talk through your project?</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {canListen ? (
                <button className="octo-greet-primary" onClick={() => openPanel({ greetAloud: true, thenListen: canListen })}>
                  <i className="fas fa-microphone mr-1.5" /> Talk to me
                </button>
              ) : null}
              <button className="octo-greet-secondary" onClick={() => openPanel({ greetAloud: false })}>
                <i className="fas fa-keyboard mr-1.5" /> Type instead
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!open && (
          <motion.button
            key="octo-fab"
            initial={{ opacity: 0, scale: 0.618 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.382, ease: EASE_PHI } }}
            exit={{ opacity: 0, scale: 0.618, transition: { duration: 0.236 } }}
            onClick={() => openPanel()}
            className="octo-fab"
            aria-label="Ask Octo, the AI assistant"
          >
            <span className="octo-fab-pulse" aria-hidden="true" />
            <i className="fas fa-wand-magic-sparkles" aria-hidden="true" />
            <span className="hidden sm:inline">Ask Octo</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="octo-panel"
            role="dialog"
            aria-label="Ask Octo, AI assistant"
            className="octo-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.382, ease: EASE_PHI } }}
            exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.236, ease: EASE_PHI } }}
          >
            <header className="octo-head">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`octo-avatar ${speaking || listening ? 'is-live' : ''}`} aria-hidden="true">
                  <i className={`fas ${listening ? 'fa-microphone' : 'fa-wand-magic-sparkles'}`} />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white leading-tight">Octo</div>
                  <div className="text-[11px] text-white/55 flex items-center gap-1.5" aria-live="polite">
                    <span className={`h-1.5 w-1.5 rounded-full ${unavailable ? 'bg-white/30' : 'bg-green-400'} ${listening || speaking ? 'animate-pulse' : ''}`} />
                    {stateLabel}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {status?.voice && (
                  <button
                    className="octo-icon-btn"
                    onClick={() => setMuted((m) => !m)}
                    aria-pressed={!muted}
                    title={muted ? "Hear replies in Abdulla's voice" : 'Mute voice'}
                    aria-label={muted ? "Hear replies in Abdulla's voice" : 'Mute voice'}
                  >
                    <i className={`fas ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
                  </button>
                )}
                <button className="octo-icon-btn" onClick={() => setShowHood((s) => !s)} aria-pressed={showHood} title="Under the hood">
                  <i className="fas fa-microchip" />
                </button>
                {turns.length > 0 && (
                  <button className="octo-icon-btn" onClick={reset} title="New conversation">
                    <i className="fas fa-rotate-left" />
                  </button>
                )}
                <button className="octo-icon-btn" onClick={close} aria-label="Close assistant">
                  <i className="fas fa-xmark" />
                </button>
              </div>
            </header>

            {showHood && (
              <div className="border-b border-white/10 px-4 py-3 bg-black/20">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-green-400 mb-2">Under the hood</div>
                <UnderTheHood usage={usage} compact />
              </div>
            )}

            <div ref={scrollRef} className="octo-scroll" aria-live="polite">
              <div className="octo-msg octo-msg-ai">
                <RichText text={WELCOME} />
              </div>

              {turns.length === 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="octo-chip" onClick={() => send(s)} disabled={busy || unavailable}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {turns.map((t, i) => (
                <div key={i} className={`octo-msg ${t.role === 'user' ? 'octo-msg-user' : 'octo-msg-ai'}`}>
                  {t.content ? <RichText text={t.content} /> : <span className="octo-typing" aria-label="Octo is typing"><i /><i /><i /></span>}
                </div>
              ))}

              {(error || unavailable) && (
                <div className="octo-note" role="status">
                  <RichText text={error || offlineNote} />
                </div>
              )}
            </div>

            <form
              className="octo-input"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              {canListen && (
                <button
                  type="button"
                  className={`octo-mic ${listening ? 'is-listening' : ''}`}
                  onClick={() => (listening ? stopListenRef.current?.() : startListening())}
                  disabled={busy || unavailable}
                  aria-pressed={listening}
                  aria-label={listening ? 'Stop listening' : 'Speak your question'}
                  title={listening ? 'Stop listening' : 'Speak your question'}
                >
                  <i className="fas fa-microphone" />
                </button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                maxLength={MAX_CHARS}
                rows={1}
                placeholder={unavailable ? 'Assistant offline' : listening ? 'Listening… speak now' : 'Ask about Abdulla or your project…'}
                disabled={unavailable}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (!e.target.value.trim()) setReviewing(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                aria-label="Message Octo"
              />
              <button type="submit" className="octo-send" disabled={!input.trim() || busy || unavailable} aria-label="Send message">
                <i className={`fas ${busy ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`} />
              </button>
            </form>
            <div className={`octo-foot ${reviewing ? 'is-review' : ''}`} aria-live="polite">
              {reviewing
                ? 'Check the transcription, edit if needed, then press Send.'
                : input.length > MAX_CHARS * 0.8
                  ? `${input.length}/${MAX_CHARS}`
                  : 'AI can make mistakes. Free demo with daily limits.'}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}

export default AskOcto
