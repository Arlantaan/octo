import { Band, Meter, Node, PacketGradient, Packets, Panel, SimState, spread } from './common'

/**
 * How the system behaves when things go wrong, and how data stays correct while they do:
 * overload control at every hop, live breaker / retry / shedding gauges driven by the drills,
 * the transactional outbox with idempotent consumers, connection pooling, zero-downtime schema
 * changes, consistency and caching rules, and the data-tier growth path.
 */

const HOPS: [string, string, string[]][] = [
  ['Client SDK', 'backoff + full jitter', ['Idempotency-Key on every write', 'retry budget ≤ 10% of traffic', 'honours Retry-After']],
  ['Cloud Armor', 'rate limits at the edge', ['per IP, per API key, per route', 'adaptive DDoS protection', 'bots challenged, not served']],
  ['Load balancer', 'outlier ejection', ['unhealthy pods out in seconds', 'connection draining on deploy', 'slow start for new pods']],
  ['Gateway', 'token bucket per tenant', ['2 s deadline set at the edge', 'deadline propagated every hop', 'interactive ahead of batch']],
  ['Service', 'concurrency limits', ['bounded queues, fail fast', 'bulkhead pool per dependency', 'shed low priority above 85% CPU']],
  ['Dependencies', 'timeouts + breakers', ['timeout < remaining deadline', 'breaker opens at 50% errors', 'half-open probes to recover']],
  ['Degradation', 'graceful, not total', ['serve last good cache entry', 'non-critical features flagged off', 'AI: smaller model or human']],
]

const OUTBOX: [string, string][] = [
  ['API pod', 'one request, one transaction'],
  ['Cloud SQL transaction', 'business row + outbox row'],
  ['Outbox relay', 'publish, then mark sent'],
  ['Pub/Sub', 'at-least-once delivery'],
  ['Consumer', 'dedupe on message ID'],
  ['Side effect', 'email · webhook · ledger'],
]

const ResilienceView = ({ users, instances, incident: inc, reduce }: SimState) => {
  const down = inc && inc.stage === 'down'
  const breaker = inc?.kind === 'instance' ? (inc.stage === 'down' ? 'OPEN' : 'HALF-OPEN') : inc?.kind === 'region' && inc.stage === 'down' ? 'OPEN' : 'CLOSED'
  const retries = down ? (inc?.kind === 'region' ? 0.1 : 0.062) : inc && inc.kind !== 'release' ? 0.014 : 0.004
  const shed = inc?.kind === 'zone' && inc.stage === 'down' ? 0.04 : inc?.kind === 'region' && inc.stage === 'down' ? 0.12 : 0
  const level = Math.min(1, users / 2_400_000)
  const tokens = Math.max(0.12, 1 - 0.7 * level - (down ? 0.15 : 0))
  const degraded = shed > 0
  const release = inc?.kind === 'release' ? inc.stage : null

  // Connection maths: every api pod opens 10 client connections; PgBouncer multiplexes them
  const apiPods = instances * 2
  const client = apiPods * 10
  const server = 40 + apiPods * 6
  const migrationStep = release === 'build' ? 0 : release === 'canary' || release === 'progressive' ? 1 : release === 'complete' ? 2 : -1

  const xs = spread(7, 30, 1420)
  const gx = spread(5, 30, 1420)
  const gw = 250

  return (
    <svg viewBox="0 0 1480 816" role="img" aria-label="Overload control along the request path, and the data-correctness patterns behind every write.">
      <PacketGradient />

      {/* Overload & failure control */}
      <Band x={30} y={24} w={1420} h={340} title="Overload & failure control · at every hop of a request" />
      {xs.slice(0, -1).map((x, i) => (
        <path key={i} id={`res-h-${i}`} d={`M ${x + 91} 96 L ${xs[i + 1] - 91} 96`} className="sas-edge" />
      ))}
      {xs.slice(0, -1).map((_, i) => <Packets key={i} path={`res-h-${i}`} count={1 + Math.round(2 * level)} dur={1} reduce={reduce} />)}
      {HOPS.map(([t, s, lines], i) => (
        <g key={t}>
          <Node x={xs[i]} y={96} w={180} title={t} sub={s} tone={i === 6 && degraded ? 'accent' : i === 5 && breaker !== 'CLOSED' ? 'alert' : 'default'} />
          {lines.map((l, j) => (
            <text key={l} x={xs[i]} y={148 + j * 17} textAnchor="middle" className="sas-line is-small">{l}</text>
          ))}
        </g>
      ))}

      {/* Live gauges */}
      <g>
        <Panel x={gx[0] - gw / 2} y={222} w={gw} h={124} title="Circuit breaker · Cloud SQL" lines={[]} tone={breaker === 'CLOSED' ? 'default' : 'alert'} />
        {['CLOSED', 'OPEN', 'HALF-OPEN'].map((st, i) => (
          <g key={st} transform={`translate(${gx[0] - gw / 2 + 16 + i * 76} 262)`}>
            <rect width={70} height={24} rx={12} className={breaker === st ? `res-pill is-${st === 'CLOSED' ? 'ok' : st === 'OPEN' ? 'bad' : 'warn'}` : 'res-pill'} />
            <text x={35} y={16} textAnchor="middle" className="k8s-pod-label">{st}</text>
          </g>
        ))}
        <text x={gx[0] - gw / 2 + 16} y={318} className="sas-line is-small">
          {breaker === 'OPEN' ? 'failing fast: no calls to a sick dependency' : breaker === 'HALF-OPEN' ? 'probing with a trickle of requests' : 'healthy: calls flowing normally'}
        </text>

        {[
          ['Retry budget', retries / 0.1, `retries ${(retries * 100).toFixed(1)}% of traffic · cap 10%`, retries >= 0.06 ? 'bad' : retries > 0.01 ? 'warn' : 'ok'],
          ['Load shedding', shed / 0.15, shed ? `${Math.round(shed * 100)}% low-priority work shed · interactive protected` : 'nothing shed · all traffic served', shed ? 'warn' : 'ok'],
          ['Tenant rate limiter', tokens, `${Math.round(tokens * 100)}% of token bucket available`, tokens < 0.35 ? 'warn' : 'ok'],
        ].map(([t, v, caption, tone], i) => (
          <g key={String(t)}>
            <Panel x={gx[i + 1] - gw / 2} y={222} w={gw} h={124} title={String(t)} lines={[]} tone={tone === 'bad' ? 'alert' : 'default'} />
            <Meter x={gx[i + 1] - gw / 2 + 16} y={270} w={gw - 32} value={Number(v)} tone={tone as 'ok' | 'warn' | 'bad'} />
            <text x={gx[i + 1] - gw / 2 + 16} y={318} className="sas-line is-small">{String(caption)}</text>
          </g>
        ))}

        <Panel
          x={gx[4] - gw / 2}
          y={222}
          w={gw}
          h={124}
          title={degraded ? 'Feature flags · degraded mode' : 'Feature flags'}
          tone={degraded ? 'accent' : 'default'}
          lines={[]}
        />
        {[
          ['checkout · sign-in · AI chat', true],
          ['recommendations', !degraded],
          ['bulk exports', !degraded],
        ].map(([f, on], i) => (
          <g key={String(f)}>
            <text x={gx[4] - gw / 2 + 16} y={268 + i * 22} className="sas-line is-small">{String(f)}</text>
            <text x={gx[4] + gw / 2 - 16} y={268 + i * 22} textAnchor="end" className={on ? 'sas-line is-small is-on' : 'sas-line is-small is-off'}>{on ? 'ON' : 'OFF'}</text>
          </g>
        ))}
      </g>

      {/* Transactional outbox */}
      <Band x={30} y={384} w={1420} h={190} title="Data correctness · transactional outbox, exactly-once effects from at-least-once delivery" />
      {(() => {
        const ox = spread(6, 30, 1420)
        return (
          <>
            {ox.slice(0, -1).map((x, i) => (
              <g key={i}>
                <path id={`res-o-${i}`} d={`M ${x + 100} 462 L ${ox[i + 1] - 100} 462`} className="sas-edge" />
                <Packets path={`res-o-${i}`} count={1} dur={1.618} reduce={reduce} />
              </g>
            ))}
            {OUTBOX.map(([t, s], i) => (
              <Node key={t} x={ox[i]} y={462} w={198} title={t} sub={s} tone={i === 1 || i === 4 ? 'accent' : 'default'} />
            ))}
            <path d={`M ${ox[4]} 491 L ${ox[4]} 520`} className="sas-control" />
            <text x={ox[4]} y={540} textAnchor="middle" className="sas-line is-small">after 5 attempts → dead-letter topic → replay tool</text>
            <text x={ox[1]} y={540} textAnchor="middle" className="sas-line is-small">never "write DB, then publish": one commit or neither</text>
            <text x={ox[2] + 100} y={560} textAnchor="middle" className="sas-line is-small">consumers are idempotent, so duplicates are harmless and ordering is per key</text>
          </>
        )
      })()}

      {/* Data-tier panels */}
      {(() => {
        const px = spread(4, 30, 1420)
        const pw = 340
        return (
          <>
            <Panel
              x={px[0] - pw / 2}
              y={600}
              w={pw}
              h={196}
              title="Connection pooling · live"
              lines={[
                `${apiPods} api pods × 10 = ${client} client connections`,
                `→ PgBouncer, transaction pooling`,
                `→ ${server} server connections to Postgres`,
                `max_connections 1,000 · ${Math.round((1 - server / 1000) * 100)}% headroom`,
                `replicas get their own pools`,
                `pool exhaustion alerts before errors`,
                `long transactions killed at 30 s`,
              ]}
            />
            <Panel
              x={px[1] - pw / 2}
              y={600}
              w={pw}
              h={196}
              title="Zero-downtime schema change"
              tone={release ? 'release' : 'default'}
              lines={[
                'every release works with N−1 schema',
                '',
                '',
                '',
                'backfills run in small batches',
                'migrations reviewed like code',
                'no locks on hot tables',
              ]}
            />
            {['Expand', 'Migrate', 'Contract'].map((st, i) => (
              <g key={st} transform={`translate(${px[1] - pw / 2 + 16 + i * 104} 668)`}>
                <rect width={96} height={46} rx={10} className={migrationStep === i ? 'res-pill is-release' : migrationStep > i ? 'res-pill is-ok' : 'res-pill'} />
                <text x={48} y={19} textAnchor="middle" className="k8s-pod-label">{st}</text>
                <text x={48} y={35} textAnchor="middle" className="sas-sub">{['add, dual-write', 'backfill, verify', 'drop old path'][i]}</text>
              </g>
            ))}
            <Panel
              x={px[2] - pw / 2}
              y={600}
              w={pw}
              h={196}
              title="Consistency & caching"
              lines={[
                'read-your-writes: pinned to primary',
                '   for 5 s after a user writes',
                'replica lag > 1 s → reads to primary',
                'cache-aside, TTL with random jitter',
                'single-flight on a miss: no stampede',
                'outbox events invalidate cache keys',
                'money paths: serializable, never cached',
              ]}
            />
            <Panel
              x={px[3] - pw / 2}
              y={600}
              w={pw}
              h={196}
              title="Data growth path"
              lines={[
                '1  Cloud SQL HA + read replicas (today)',
                '2  partition hot tables by tenant',
                '3  cold data archived to BigQuery',
                '4  AlloyDB for a higher write ceiling',
                '5  Spanner if writes must go global',
                'each step triggered by a measured',
                '   threshold, never by fashion',
              ]}
            />
          </>
        )
      })()}
    </svg>
  )
}

export default ResilienceView

