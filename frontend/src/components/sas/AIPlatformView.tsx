import { useEffect, useState } from 'react'
import { Band, Node, PacketGradient, Packets, SimState, Tone, curve, spread } from './common'

/**
 * The AI tier in depth: every request is authenticated, budgeted, screened by Model Armor, stripped of
 * personal data, grounded by retrieval, routed to the right model on Vertex AI, screened again on
 * the way out and streamed back. Below it: knowledge ingestion, LLMOps, and the first-token latency budget.
 */

const ROW = 118
const XS = spread(8, 20, 1440)
const STEPS = [
  ['client', 'Client', 'streams over SSE', 'Request received'],
  ['gateway', 'AI gateway', 'auth · rate limit · budget', 'Authenticating, rate-limiting, checking budget'],
  ['armorIn', 'Model Armor', 'screens the prompt', 'Screening the prompt for injection and jailbreaks'],
  ['dlp', 'PII redaction', 'Sensitive Data Protection', 'Redacting personal data before the model sees it'],
  ['context', 'Context builder', 'prompt · history · RAG', 'Retrieving grounded context with access filters'],
  ['router', 'Model router', 'small model first · larger if hard', 'Routing to the smallest model that meets the bar'],
  ['llm', 'LLM on Vertex AI', 'prompt caching · streaming', 'Generating, with the knowledge base served from cache'],
  ['armorOut', 'Model Armor', 'screens the response', 'Screening the response, then streaming it back'],
] as const

const LATENCY = [
  ['Gateway', 8],
  ['Model Armor in', 45],
  ['PII redaction', 30],
  ['Retrieval + rerank', 60],
  ['Routing', 4],
  ['First token (cached)', 620],
  ['Model Armor out', 20],
] as const

const AIPlatformView = ({ users, incident: inc, reduce }: SimState) => {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 618 * 1.618)
    return () => window.clearInterval(id)
  }, [reduce])

  const primaryDown = (inc?.kind === 'instance' && inc.stage === 'down') || (inc?.kind === 'region' && inc.stage !== 'recovering')
  const release = inc?.kind === 'release' ? inc.stage : null
  const intensity = Math.min(1, users / 2_400_000)
  const pkt = Math.max(1, Math.round(1 + 3 * intensity))
  const total = LATENCY.reduce((s, [, ms]) => s + ms, 0)

  const toneFor = (id: string): Tone => {
    if (id === 'llm' && primaryDown) return 'alert'
    if (STEPS[step][0] === id) return 'accent'
    return id === 'armorIn' || id === 'armorOut' || id === 'dlp' ? 'security' : 'default'
  }

  return (
    <svg viewBox="0 0 1480 960" role="img" aria-label="AI request pipeline on Google Cloud, with retrieval, ingestion and LLMOps.">
      <PacketGradient />

      <Band x={20} y={40} w={1440} h={300} title="Request path · every call, in order" />
      <text x={1440} y={58} textAnchor="end" className="sas-phase-mini">{STEPS[step][3]}</text>

      {/* Forward path and return stream */}
      {XS.slice(0, -1).map((x, i) => (
        <path key={i} id={`ai-f-${i}`} d={`M ${x + 76} ${ROW} L ${XS[i + 1] - 76} ${ROW}`} className="sas-edge" />
      ))}
      <path id="ai-ret" d={`M ${XS[7]} ${ROW + 29} C ${XS[7]} 205, ${XS[0]} 205, ${XS[0]} ${ROW + 29}`} className="sas-edge" />
      <text x={(XS[0] + XS[7]) / 2} y={222} textAnchor="middle" className="sas-vpc-title">response streamed token by token · server-sent events</text>
      {XS.slice(0, -1).map((_, i) => <Packets key={i} path={`ai-f-${i}`} count={pkt} dur={1} reduce={reduce} />)}
      <Packets path="ai-ret" count={pkt + 1} dur={3.236} reduce={reduce} />

      {STEPS.map(([id, t, s], i) => (
        <Node
          key={id + i}
          x={XS[i]}
          y={ROW}
          title={t}
          sub={id === 'llm' && primaryDown ? '429 · capacity exhausted' : s}
          tone={toneFor(id)}
        />
      ))}

      {/* Side services */}
      {[
        [XS[1], 'Budgets & quotas', 'per-user · daily spend cap', 'default'],
        [XS[3], 'Prompt registry', release ? (release === 'complete' ? 'v2 live · eval gate passed' : `v2 ${release} · evals running`) : 'versioned · reviewed · tested', release ? 'release' : 'default'],
        [XS[4], 'Vertex Vector Search', 'ANN · filtered by user rights', 'default'],
        [XS[5], 'Ranking API', 'rerank top-k for precision', 'default'],
        [XS[6], 'LLM · fallback region', primaryDown ? 'serving all traffic' : 'global endpoint failover', primaryDown ? 'accent' : 'muted'],
        [XS[7], 'Semantic cache', 'Memorystore · repeat questions', 'default'],
      ].map(([x, t, s, tone]) => (
        <g key={String(t)}>
          <path d={`M ${x} 261 L ${x} ${ROW + 29}`} className="sas-control" />
          <Node x={Number(x)} y={290} title={String(t)} sub={String(s)} tone={tone as Tone} />
        </g>
      ))}
      {primaryDown && <path id="ai-fb" d={curve(XS[5] + 76, ROW + 10, XS[6] - 76, 290)} className="sas-edge" />}
      {primaryDown && <Packets path="ai-fb" count={3} dur={1} reduce={reduce} />}

      {/* Knowledge ingestion */}
      <Band x={20} y={400} w={1440} h={150} title="Knowledge ingestion · event-driven on every document change" />
      {(() => {
        const xs = spread(6, 20, 1440)
        const items = [
          ['Cloud Storage', 'source documents · versioned'],
          ['Eventarc', 'fires on upload or edit'],
          ['Document AI', 'parse · OCR · tables'],
          ['Chunking', 'semantic chunks + metadata'],
          ['Embeddings', 'Vertex AI text embeddings'],
          ['Index upsert', '→ Vector Search · minutes'],
        ]
        return items.map(([t, s], i) => (
          <g key={t}>
            {i > 0 && <path id={`ai-in-${i}`} d={`M ${xs[i - 1] + 76} 485 L ${xs[i] - 76} 485`} className="sas-edge" />}
            {i > 0 && <Packets path={`ai-in-${i}`} count={1} dur={2.618} reduce={reduce} />}
            <Node x={xs[i]} y={485} title={t} sub={s} />
          </g>
        ))
      })()}

      {/* LLMOps */}
      <Band x={20} y={580} w={1440} h={150} title="LLMOps · measured on every change" />
      {[
        ['Cloud Trace', 'one span per pipeline step'],
        ['Token & cost metering', 'per user, feature, model → BigQuery'],
        ['Evaluation suite', 'golden set · LLM-as-judge in CI'],
        ['Feedback loop', 'ratings become new eval cases'],
        ['Guard-rail metrics', 'block rate · PII hits · refusals'],
        ['Quality SLOs', 'groundedness · latency · cost'],
      ].map(([t, s], i) => (
        <Node key={t} x={spread(6, 20, 1440)[i]} y={665} w={220} title={t} sub={s} tone={release && i === 2 ? 'release' : 'muted'} />
      ))}

      {/* Latency budget */}
      <Band x={20} y={760} w={1440} h={180} title={`Time-to-first-token budget · ${total} ms (illustrative)`} />
      {(() => {
        let x = 50
        const W = 1380
        return LATENCY.map(([k, ms], i) => {
          const w = (ms / total) * W
          const g = (
            <g key={k}>
              <rect x={x} y={812} width={Math.max(2, w - 2)} height={34} rx={6} className={`ai-lat is-${i === 5 ? 'model' : i === 1 || i === 2 || i === 6 ? 'guard' : 'infra'}`} />
              {w > 90 && <text x={x + w / 2} y={834} textAnchor="middle" className="sas-title">{ms} ms</text>}
              {(() => {
                const wide = w > 200
                const last = i === LATENCY.length - 1
                const lx = wide ? x + w / 2 : last ? x + w : x + 2
                const ly = wide ? 874 : i % 2 ? 900 : 874
                return (
                  <>
                    <text x={lx} y={ly} textAnchor={wide ? 'middle' : last ? 'end' : 'start'} className="sas-sub">{`${k} · ${ms} ms`}</text>
                    <path d={`M ${wide ? lx : last ? x + w - 1 : x + 1} 846 L ${wide ? lx : last ? x + w - 1 : x + 1} ${ly - 12}`} className="sas-control" />
                  </>
                )
              })()}
            </g>
          )
          x += w
          return g
        })
      })()}
      <text x={50} y={928} className="sas-vpc-title">Guard rails cost about 95 ms of each first token; the model is the long pole, so caching and model choice matter most.</text>
    </svg>
  )
}

export default AIPlatformView
