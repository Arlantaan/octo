import { useEffect, useState } from 'react'
import { Band, Node, PacketGradient, Packets, SimState, Tone, spread } from './common'

/**
 * AI engineering as an engineering discipline: model behaviour ships through an eval-gated
 * lifecycle, retrieval is measured and grounded, agents act only inside explicit permissions,
 * and every model decision is a cost / quality / latency trade-off with a fallback.
 */

const LIFECYCLE: [string, string][] = [
  ['Frame', 'Five Ws · success metric'],
  ['Dataset', 'golden + adversarial cases'],
  ['Baseline', 'prompt · model · tools'],
  ['Offline evals', 'rubrics · calibrated judge'],
  ['Red team', 'injection · jailbreak · leaks'],
  ['Shadow traffic', 'real inputs, no user impact'],
  ['Canary A/B', 'online metrics · rollback'],
  ['Monitor', 'drift · feedback · cost'],
]

const RAG: [string, string][] = [
  ['Query rewrite', 'expand · decompose'],
  ['Hybrid retrieval', 'BM25 + dense vectors'],
  ['Rank fusion', 'reciprocal rank fusion'],
  ['Rerank', 'top 50 → best 8'],
  ['Context packing', 'dedupe · token budget'],
  ['Generate', 'every claim cites a source'],
  ['Groundedness check', 'unsupported → decline'],
]

const STRATEGY: [string, string][] = [
  ['Routing by difficulty', 'small → mid → large tier, by classifier'],
  ['Prompt caching', 'stable prefix cached · 75% saving on Octo'],
  ['Structured outputs', 'schema-validated, never regex-parsed'],
  ['Context engineering', 'retrieve and compact, never stuff'],
  ['Batch inference', 'offline jobs kept off the hot path'],
  ['Fallback chain', 'smaller model → cached answer → human'],
  ['Token budgets', 'max output per feature, enforced'],
  ['Prompts as code', 'versioned · reviewed · eval-gated'],
]

const AGENT: [string, string, number, number][] = [
  ['Planner · LLM', 'reasoning · step plan', 0, 0],
  ['Tool registry', 'typed JSON schemas', 1, 0],
  ['Policy check', 'least privilege · per-role allow-list', 2, 0],
  ['Sandbox', 'isolated · no network by default', 2, 1],
  ['Human approval', 'any consequential action', 1, 1],
  ['Audit log', 'every call, input and result', 0, 1],
]

const AILifecycleView = ({ incident: inc, reduce }: SimState) => {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % LIFECYCLE.length), 1000)
    return () => window.clearInterval(id)
  }, [reduce])
  const release = inc?.kind === 'release' ? inc.stage : null
  // During a release, light the gate stages in order: build → evals, canary → shadow/canary, complete → monitor
  const releaseStep = release === 'build' ? 3 : release === 'canary' ? 5 : release === 'progressive' ? 6 : release === 'complete' ? 7 : -1
  const lifeTone = (i: number): Tone => (releaseStep >= 0 ? (i <= releaseStep && i >= 3 ? 'release' : 'default') : i === step ? 'accent' : i === 3 || i === 4 ? 'security' : 'default')

  const lx = spread(8, 30, 1420)
  const rx = spread(7, 30, 1420)

  return (
    <svg viewBox="0 0 1480 930" role="img" aria-label="AI engineering lifecycle: eval-gated releases, retrieval quality, agent safety and model strategy.">
      <PacketGradient />

      {/* Eval-gated lifecycle */}
      <Band x={30} y={24} w={1420} h={250} title="Model behaviour lifecycle · nothing reaches users without passing the gate" />
      {lx.slice(0, -1).map((x, i) => (
        <g key={i}>
          <path id={`ail-${i}`} d={`M ${x + 80} 100 L ${lx[i + 1] - 80} 100`} className="sas-edge" />
          <Packets path={`ail-${i}`} count={1} dur={1} reduce={reduce} />
        </g>
      ))}
      <path id="ail-loop" d={`M ${lx[7]} 129 C ${lx[7]} 196, ${lx[1]} 196, ${lx[1]} 129`} className="sas-edge" />
      <Packets path="ail-loop" count={2} dur={4.236} reduce={reduce} />
      <text x={(lx[1] + lx[7]) / 2} y={214} textAnchor="middle" className="sas-vpc-title">every production failure becomes a new test case</text>
      {LIFECYCLE.map(([t, s], i) => (
        <Node key={t} x={lx[i]} y={100} w={160} title={t} sub={s} tone={lifeTone(i)} />
      ))}
      <g transform={`translate(${(lx[4] + lx[5]) / 2 - 300} 232)`}>
        <rect width={600} height={30} rx={15} className={release ? 'res-pill is-release' : 'res-pill'} />
        <text x={300} y={20} textAnchor="middle" className="sas-line is-small">
          {release && releaseStep >= 5 ? 'Gate passed: ' : 'Release gate: '}quality ≥ baseline · safety suite 100% · cost and latency within budget
        </text>
      </g>

      {/* Retrieval quality */}
      <Band x={30} y={294} w={1420} h={196} title="Retrieval quality · grounded answers with citations, measured" />
      {rx.slice(0, -1).map((x, i) => (
        <g key={i}>
          <path id={`rag-${i}`} d={`M ${x + 88} 370 L ${rx[i + 1] - 88} 370`} className="sas-edge" />
          <Packets path={`rag-${i}`} count={1} dur={1.236} reduce={reduce} />
        </g>
      ))}
      {RAG.map(([t, s], i) => (
        <Node key={t} x={rx[i]} y={370} w={176} title={t} sub={s} tone={i === 6 ? 'security' : 'default'} />
      ))}
      <text x={50} y={428} className="sas-line">Measured offline and on sampled traffic: recall@20 · MRR · faithfulness · citation accuracy · correct-refusal rate</text>
      <text x={50} y={450} className="sas-line">Permissions enforced at retrieval time, never in the prompt · chunking and embedding model versioned with the index</text>
      <text x={50} y={472} className="sas-line">Re-index without downtime: build the new index alongside, evaluate it, then switch the alias</text>

      {/* Agents */}
      <Band x={30} y={510} w={700} h={400} title="Agents & tool use · autonomy inside explicit limits" />
      {(() => {
        const ax = [150, 380, 610]
        const ay = [580, 690]
        const pos = AGENT.map(([, , c, r]) => ({ x: ax[c], y: ay[r] }))
        const order = [0, 1, 2, 3, 4, 5]
        return (
          <>
            {order.slice(0, -1).map((i) => {
              const a = pos[i]
              const b = pos[i + 1]
              const d = a.y === b.y ? `M ${a.x + (b.x > a.x ? 100 : -100)} ${a.y} L ${b.x + (b.x > a.x ? -100 : 100)} ${b.y}` : `M ${a.x} ${a.y + 29} L ${b.x} ${b.y - 29}`
              return (
                <g key={i}>
                  <path id={`ag-${i}`} d={d} className="sas-edge" />
                  <Packets path={`ag-${i}`} count={1} dur={1.618} reduce={reduce} />
                </g>
              )
            })}
            <path d={`M ${pos[5].x} ${pos[5].y - 29} L ${pos[0].x} ${pos[0].y + 29}`} className="sas-control" />
            {AGENT.map(([t, s], i) => (
              <Node key={t} x={pos[i].x} y={pos[i].y} w={200} title={t} sub={s} tone={i === 2 || i === 4 ? 'security' : i === 0 ? 'accent' : 'default'} />
            ))}
            {[
              'step limit, spend limit and timeout on every task',
              'tool results treated as data, never as instructions',
              'write actions need an idempotency key and a dry run',
              'short-term memory compacted · long-term memory with TTL',
              'trajectories evaluated, not just final answers',
            ].map((l, i) => (
              <text key={l} x={56} y={770 + i * 24} className="sas-line">{l}</text>
            ))}
          </>
        )
      })()}

      {/* Model strategy */}
      <Band x={750} y={510} w={700} h={400} title="Model strategy · every choice a quality, cost and latency trade-off" />
      {STRATEGY.map(([t, s], i) => (
        <Node key={t} x={spread(2, 750, 700)[i % 2]} y={580 + Math.floor(i / 2) * 82} w={326} h={62} title={t} sub={s} tone={i === 1 || i === 7 ? 'accent' : 'default'} />
      ))}
    </svg>
  )
}

export default AILifecycleView
