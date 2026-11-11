import { motion } from 'framer-motion'
import data from '../data/model-eval.json'

/**
 * Published results of backend/scripts/compare_models.py: the same 40 cases, Octo's exact
 * instructions, four model configurations. Numbers come straight from the run summary.
 */

const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]

const NAMES: Record<string, [string, string]> = {
  'model-a': ['Model A', 'Provider 1 · fast tier'],
  'model-b@minimal': ['Model B', 'Provider 2 · minimal reasoning'],
  'model-b@low': ['Model B', 'Provider 2 · low reasoning'],
  'model-c@low': ['Model C', 'Provider 2 · reasoning tier'],
}

const CATEGORY_LABEL: Record<string, string> = {
  grounded: 'Grounded',
  honesty: 'Honesty',
  injection: 'Injection',
  scope: 'Scope',
  general: 'General',
}

interface ModelRow {
  id: string
  passed: number
  total: number
  by_category: Record<string, number[]>
  ttft_p50_ms: number | null
  ttft_p95_ms: number | null
  cost_per_1k_answers_usd: number
}

const rows = data.models as ModelRow[]
const best = {
  passed: Math.max(...rows.map((r) => r.passed)),
  ttft: Math.min(...rows.map((r) => r.ttft_p50_ms ?? Infinity)),
  cost: Math.min(...rows.map((r) => r.cost_per_1k_answers_usd)),
}
const runDate = (() => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(data.run)
  return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : data.run
})()

const sec = (ms: number | null) => (ms == null ? '–' : `${(ms / 1000).toFixed(1)} s`)

export interface Verdict {
  role: string
  model: string
  text: string
}

const ModelEvaluation = ({ verdicts }: { verdicts: Verdict[] }) => (
  <div className="meval">
    <div className="meval-table" role="table" aria-label="Model evaluation results">
      <div className="meval-row is-head" role="row">
        <span role="columnheader">Model</span>
        <span role="columnheader">Passed</span>
        <span role="columnheader">By category</span>
        <span role="columnheader">First words p50 / p95</span>
        <span role="columnheader">Cost per 1,000 answers</span>
      </div>
      {rows.map((r, i) => {
        const [name, sub] = NAMES[r.id] ?? [r.id, '']
        return (
          <motion.div
            key={r.id}
            className="meval-row"
            role="row"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.618, ease: EASE_PHI, delay: i * 0.0618 }}
          >
            <span role="cell" className="meval-model">
              <strong>{name}</strong>
              <em>{sub}</em>
            </span>
            <span role="cell" data-label="Passed" className={r.passed === best.passed ? 'is-best' : ''}>
              <b>{r.passed}</b>/{r.total}
              <i className="meval-bar"><i style={{ width: `${(r.passed / r.total) * 100}%` }} /></i>
            </span>
            <span role="cell" data-label="By category" className="meval-cats">
              {data.categories.map((c) => {
                const [p, t] = r.by_category[c] ?? [0, 0]
                return (
                  <span key={c} className={p === t ? 'is-full' : 'is-miss'} title={`${CATEGORY_LABEL[c]}: ${p}/${t}`}>
                    {CATEGORY_LABEL[c]} <b>{p}/{t}</b>
                  </span>
                )
              })}
            </span>
            <span role="cell" data-label="First words p50 / p95" className={r.ttft_p50_ms === best.ttft ? 'is-best' : ''}>
              <b>{sec(r.ttft_p50_ms)}</b> / {sec(r.ttft_p95_ms)}
            </span>
            <span role="cell" data-label="Cost per 1,000 answers" className={r.cost_per_1k_answers_usd === best.cost ? 'is-best' : ''}>
              <b>${r.cost_per_1k_answers_usd.toFixed(2)}</b>
            </span>
          </motion.div>
        )
      })}
    </div>

    <div className="meval-verdicts">
      {verdicts.map((v) => (
        <div key={v.role} className="meval-verdict">
          <span className="meval-role">{v.role}</span>
          <strong>{v.model}</strong>
          <p>{v.text}</p>
        </div>
      ))}
    </div>

    <p className="meval-method">
      Method: {data.cases} cases (grounded answers, honesty traps, prompt-injection attacks, an off-scope request and a general
      question), each sent once to every model with Octo’s exact production instructions, over two runs on {runDate}. Answers are
      scored by deterministic rules (required facts, forbidden claims, leaked instructions, length limits); the first run’s answers
      were also reviewed by hand. Total cost ${data.total_spend_usd.toFixed(2)}. Costs use published list prices. A snapshot, not a benchmark: the harness is re-run whenever a model or prompt changes.
    </p>
  </div>
)

export default ModelEvaluation
