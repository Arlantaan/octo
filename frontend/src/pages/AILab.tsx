import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SEO from '../components/SEO'
import { getStatus, openOcto, scopeProject, type AIStatus, type ProjectBrief } from '../ai/api'

const MAX_CHARS = 2000
const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]

const EXAMPLES = [
  { label: 'Restaurant orders', text: 'My restaurant takes orders on WhatsApp and we keep losing track of them during busy hours.' },
  { label: 'Multi-site payroll', text: 'We have 150 staff across 9 fuel stations and payroll takes our HR team a full week every month.' },
  { label: 'Online retail', text: 'I sell perfume on Instagram but customers keep asking for prices and stock, and I want a proper online shop.' },
]

const W_ROWS: Array<{ key: keyof ProjectBrief; label: string; icon: string }> = [
  { key: 'who', label: 'Who', icon: 'fa-user-group' },
  { key: 'what', label: 'What', icon: 'fa-bullseye' },
  { key: 'when', label: 'When', icon: 'fa-clock' },
  { key: 'where', label: 'Where', icon: 'fa-location-dot' },
  { key: 'why', label: 'Why', icon: 'fa-magnifying-glass' },
]

const BUILT_WITH = [
  { title: 'Model selection', body: 'The smallest model that meets the quality bar, chosen by evaluation and served from a Python FastAPI backend, with an automatic fallback to a second provider.' },
  { title: 'Structured outputs', body: 'The Scoper’s brief is constrained to a validated Pydantic schema, so its structure is guaranteed and downstream software can rely on it.' },
  { title: 'Streaming', body: 'Replies stream token by token over server-sent events; on a cached request the first words typically arrive in under a second.' },
  { title: 'Prompt caching', body: 'Stable instructions and knowledge are served from cache, so repeat requests pay a tenth of the standard input price.' },
  { title: 'Layered guard rails', body: 'Per-visitor rate limits, daily and total spend ceilings, input-size limits and server-side keys, all enforced in code rather than left to the model.' },
  { title: 'Grounded by design', body: 'Octo is instructed to answer only from a curated knowledge base, and to say plainly when a question falls outside it.' },
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
    setLoading(false)
  }

  return (
    <section className="ai-lab">
      <SEO
        title="AI Lab"
        description="Production AI systems running live: Octo, a grounded assistant, and the Five Ws Project Scoper, which turns a described problem into a structured project brief."
        path="/ai-lab"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="section-label">AI Lab</span>
          <h1 className="section-title-main">Production AI, running live</h1>
          <p className="section-intro">
            Two production AI systems operating on this site, built to the same standard as client
            work. Use them directly.
          </p>
          <button className="btn-primary-hero rounded-full mt-6" onClick={() => openOcto()}>
            <i className="fas fa-wand-magic-sparkles mr-2" /> Chat with Octo
          </button>
        </div>

        {/* ---- 5 Ws Project Scoper ---- */}
        <div className="ai-card mt-14">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white">Five Ws Project Scoper</h2>
              <p className="text-white/65 mt-1 max-w-2xl">
                Describe a problem in plain language. The system analyses it along the Five Ws (Who, What, When, Where
                and Why) and returns a structured project brief, ready to submit for a quote.
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
            placeholder="Describe the problem: who is affected, what is going wrong, and what you want to achieve."
            disabled={unavailable}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="octo-chip" onClick={() => setProblem(ex.text)} disabled={unavailable}>
                  {ex.label}
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

                <div className="mt-6 btn-row !justify-start">
                  <button
                    className="btn-primary-hero rounded-full"
                    onClick={() => navigate('/quote', { state: { project: briefToText(brief) } })}
                  >
                    Submit this brief for a quote <i className="fas fa-arrow-right ml-2" />
                  </button>
                  <button className="ai-ghost-btn" onClick={() => openOcto(`I just scoped "${brief.title}". What would you suggest as a first step?`)}>
                    Discuss with Octo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- How it's built ---- */}
        <div className="mt-14">
          <h2 className="text-2xl font-bold text-white text-center">Engineering</h2>
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
