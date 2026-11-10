import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SEO from '../components/SEO'
import { getStatus, openOcto, scopeProject, type AIStatus, type AIUsage, type ProjectBrief } from '../ai/api'
import UnderTheHood from '../ai/UnderTheHood'

const MAX_CHARS = 2000
const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]

const EXAMPLES = [
  'My restaurant takes orders on WhatsApp and we keep losing track of them during busy hours.',
  'We have 150 staff across 9 fuel stations and payroll takes our HR team a full week every month.',
  'I sell perfume on Instagram but customers keep asking for prices and stock, and I want a proper online shop.',
]

const W_ROWS: Array<{ key: keyof ProjectBrief; label: string; icon: string }> = [
  { key: 'who', label: 'Who', icon: 'fa-user-group' },
  { key: 'what', label: 'What', icon: 'fa-bullseye' },
  { key: 'when', label: 'When', icon: 'fa-clock' },
  { key: 'where', label: 'Where', icon: 'fa-location-dot' },
  { key: 'why', label: 'Why', icon: 'fa-magnifying-glass' },
]

const BUILT_WITH = [
  { title: 'Claude Haiku 5.5', body: "Anthropic's fast, low-cost model, called from a Python FastAPI backend through the official SDK." },
  { title: 'Structured outputs', body: 'The Scoper returns a validated JSON brief (a Pydantic schema), so every field is always there.' },
  { title: 'Streaming', body: 'Octo’s replies stream word by word over server-sent events, so answers start appearing instantly.' },
  { title: 'Prompt caching', body: 'The knowledge pack is cached, so repeat requests pay about a tenth of the normal input price.' },
  { title: 'Guard rails', body: 'Per-visitor limits, a daily and total spend cap, input size limits, and the API key never leaves the server.' },
  { title: 'Grounded & honest', body: 'Octo only claims work Abdulla has actually done, and says so plainly when something is new to him.' },
]

function briefToText(b: ProjectBrief): string {
  return [
    `${b.title}`,
    '',
    b.summary,
    '',
    `Who: ${b.who}`,
    `What: ${b.what}`,
    `When: ${b.when}`,
    `Where: ${b.where}`,
    `Why: ${b.why}`,
    '',
    b.recommended_services.length ? `Services: ${b.recommended_services.join(', ')}` : '',
    b.questions_to_clarify.length ? `Open questions:\n${b.questions_to_clarify.map((q) => `- ${q}`).join('\n')}` : '',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim()
}

const AILab = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [problem, setProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<ProjectBrief | null>(null)
  const [message, setMessage] = useState('')
  const [usage, setUsage] = useState<AIUsage | null>(null)

  useEffect(() => {
    getStatus().then(setStatus)
  }, [])

  const unavailable = status !== null && !status.available

  const run = async () => {
    if (problem.trim().length < 10 || loading) return
    setLoading(true)
    setMessage('')
    setBrief(null)
    const result = await scopeProject(problem.trim())
    setBrief(result.brief)
    setMessage(result.message ?? '')
    if (result.usage) setUsage(result.usage)
    setLoading(false)
  }

  return (
    <section className="ai-lab">
      <SEO
        title="AI Lab"
        description="Try Abdulla's AI work live: Octo, an AI assistant grounded in his portfolio, and the 5 Ws Project Scoper that turns your problem into a project brief."
        path="/ai-lab"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="section-label">AI Lab</span>
          <h1 className="section-title-main">AI engineering, live on this site</h1>
          <p className="section-intro">
            Two small AI products Abdulla built with the Claude API. Try them, then peek under the hood to see exactly
            what each answer cost.
          </p>
          <button className="btn-primary-hero rounded-full mt-6" onClick={() => openOcto()}>
            <i className="fas fa-wand-magic-sparkles mr-2" /> Chat with Octo
          </button>
        </div>

        {/* ---- 5 Ws Project Scoper ---- */}
        <div className="ai-card mt-14">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white">5 Ws Project Scoper</h2>
              <p className="text-white/65 mt-1 max-w-2xl">
                Describe a problem in your own words. The AI breaks it down using Abdulla's Who, What, When, Where, Why
                method and turns it into a project brief you can send him.
              </p>
            </div>
            {unavailable && (
              <span className="text-xs rounded-full border border-white/15 px-3 py-1 text-white/60">Demo offline</span>
            )}
          </div>

          <label htmlFor="scope-problem" className="sr-only">Describe your problem or project</label>
          <textarea
            id="scope-problem"
            className="ai-textarea mt-5"
            rows={5}
            maxLength={MAX_CHARS}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="For example: customers can't find our opening hours and keep calling during service…"
            disabled={unavailable}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="octo-chip" onClick={() => setProblem(ex)} disabled={unavailable}>
                  Example {i + 1}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/40 tabular-nums">{problem.length}/{MAX_CHARS}</span>
          </div>

          <button
            className="btn-primary-hero rounded-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={run}
            disabled={loading || unavailable || problem.trim().length < 10}
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin mr-2" /> Scoping…
              </>
            ) : (
              <>
                <i className="fas fa-diagram-project mr-2" /> Scope my project
              </>
            )}
          </button>

          {unavailable && (
            <p className="mt-4 text-sm text-white/60">
              {status?.reason === 'budget'
                ? 'The demo has used its budget for now.'
                : 'The demo is offline right now.'}{' '}
              You can still describe your project on the <Link className="text-green-400 underline" to="/quote">quote page</Link>.
            </p>
          )}
          {message && <p className="mt-4 text-sm text-amber-300/90" role="status">{message}</p>}

          <AnimatePresence>
            {brief && (
              <motion.div
                key="brief"
                className="ai-brief mt-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.618, ease: EASE_PHI } }}
                exit={{ opacity: 0 }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-green-400">Project brief</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{brief.title}</h3>
                <p className="text-white/75 mt-2">{brief.summary}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {W_ROWS.map((w, i) => (
                    <motion.div
                      key={w.key}
                      className="ai-w"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.236 + i * 0.0618, duration: 0.382, ease: EASE_PHI } }}
                    >
                      <div className="flex items-center gap-2 text-green-400 font-bold">
                        <i className={`fas ${w.icon} text-sm`} /> {w.label}?
                      </div>
                      <p className="text-sm text-white/75 mt-1.5 leading-relaxed">{brief[w.key] as string}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-white mb-2">Recommended services</div>
                    <div className="flex flex-wrap gap-1.5">
                      {brief.recommended_services.length ? (
                        brief.recommended_services.map((s) => <span key={s} className="career-chip">{s}</span>)
                      ) : (
                        <span className="text-sm text-white/50">None yet, more detail needed.</span>
                      )}
                    </div>
                    {brief.relevant_experience && (
                      <p className="text-sm text-white/65 mt-3">
                        <i className="fas fa-circle-check text-green-400 mr-1.5" />
                        {brief.relevant_experience}
                      </p>
                    )}
                  </div>
                  <div>
                    {brief.questions_to_clarify.length > 0 && (
                      <>
                        <div className="text-sm font-semibold text-white mb-2">Questions to clarify</div>
                        <ul className="career-points">
                          {brief.questions_to_clarify.map((q) => <li key={q}>{q}</li>)}
                        </ul>
                      </>
                    )}
                    <p className="text-sm text-white/75 mt-3"><span className="font-semibold text-white">Next step: </span>{brief.next_step}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="btn-primary-hero rounded-full"
                    onClick={() => navigate('/quote', { state: { project: briefToText(brief) } })}
                  >
                    Send this brief to Abdulla <i className="fas fa-arrow-right ml-2" />
                  </button>
                  <button className="ai-ghost-btn" onClick={() => openOcto(`I just scoped "${brief.title}". What would you suggest as a first step?`)}>
                    Discuss with Octo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- Under the hood ---- */}
        <div className="ai-card mt-8">
          <h2 className="text-xl font-bold text-white">Under the hood</h2>
          <p className="text-white/60 text-sm mt-1 mb-4">The real numbers from your last scoping request.</p>
          <UnderTheHood usage={usage} />
        </div>

        {/* ---- How it's built ---- */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-white text-center">How it's built</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUILT_WITH.map((b) => (
              <div key={b.title} className="ai-card !p-5">
                <div className="font-semibold text-white">{b.title}</div>
                <p className="text-sm text-white/65 mt-1.5 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AILab
