import type { AIUsage } from './api'

/** Transparent engineering panel: which model answered, tokens, cache hits, cost and latency. */
const UnderTheHood = ({ usage, compact = false }: { usage: AIUsage | null; compact?: boolean }) => {
  if (!usage) {
    return <p className="text-xs text-white/45">Send a message to see what happens under the hood.</p>
  }
  const rows: Array<[string, string]> = [
    ['Model', usage.model],
    ['Input tokens', usage.input_tokens.toLocaleString()],
    ['Cached tokens (read)', usage.cache_read_tokens.toLocaleString()],
    ['Output tokens', usage.output_tokens.toLocaleString()],
    ['Cost of this reply', `$${usage.cost_usd.toFixed(5)}`],
    ['Response time', `${(usage.latency_ms / 1000).toFixed(2)}s`],
  ]
  return (
    <dl className={`grid ${compact ? 'grid-cols-2 gap-x-4 gap-y-1' : 'grid-cols-2 sm:grid-cols-3 gap-3'} text-xs`}>
      {rows.map(([k, v]) => (
        <div key={k} className={compact ? '' : 'rounded-lg border border-white/10 bg-white/[0.03] p-2.5'}>
          <dt className="text-white/45">{k}</dt>
          <dd className="font-mono text-white/85 tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default UnderTheHood
