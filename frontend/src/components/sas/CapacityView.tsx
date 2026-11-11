import { SimState } from './common'

/**
 * The numbers behind the diagram, derived live from the traffic control: a capacity model from
 * users to pods, connections, queue throughput and AI spend; N+1 zone headroom; and the SLOs,
 * error budget and multi-window burn-rate alerting that govern the system.
 * Coefficients are stated assumptions, chosen to be validated by load testing.
 */

const n = (v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : v >= 10_000 ? `${Math.round(v / 1_000)}k` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}k` : v >= 10 ? `${Math.round(v)}` : v.toFixed(2))
const pct = (v: number) => `${Math.round(v * 100)}%`

const POD_RPS = 4_000 // rps one api pod serves at the 70% CPU target, from load test (assumption)

const CapacityView = ({ users, instances, workers, incident: inc }: SimState) => {
  const rps = users * 0.08
  const origin = rps * 0.4
  const apiPods = instances * 2
  const perPod = origin / apiPods
  const cpu = (0.7 * perPod) / POD_RPS
  const cpuAfterZoneLoss = (0.7 * origin) / (Math.max(1, Math.round((apiPods * 2) / 3)) * POD_RPS)
  const redisOps = origin * 2.5
  const dbQueries = origin * 1.6 * 0.2
  const replicas = Math.min(3, Math.max(1, Math.ceil(rps / 60_000)))
  const reads = dbQueries * 0.9
  const writes = dbQueries * 0.1
  const server = 40 + apiPods * 6
  const msgs = origin * 0.05
  const aiRps = users * 0.0004
  const aiCostHour = aiRps * 3600 * 0.0001

  const rows: [string, string, string, boolean?][] = [
    ['Active users', n(users), 'traffic control'],
    ['Requests / s at the edge', n(rps), '0.08 requests per active user per second'],
    ['Requests / s reaching origin', n(origin), 'CDN absorbs 60% (static and cacheable)'],
    ['API pods (HPA)', String(apiPods), `${n(perPod)} rps each · ${n(POD_RPS)} rps per pod at 70% CPU`],
    ['Pod CPU', pct(cpu), 'HPA target 70%', cpu > 0.7],
    ['Pod CPU if a zone is lost', pct(cpuAfterZoneLoss), 'N+1 zones: survivors hold the load before autoscaling', cpuAfterZoneLoss > 0.9],
    ['Redis operations / s', n(redisOps), '2.5 cache reads per request · 80% hit rate'],
    ['Database queries / s', n(dbQueries), '1.6 queries per request × 20% cache misses'],
    ['Reads per replica / s', n(reads / replicas), `90% of queries · ${replicas} replica${replicas > 1 ? 's' : ''}`],
    ['Writes on primary / s', n(writes), 'single primary · far below its write ceiling'],
    ['Postgres server connections', String(server), `PgBouncer multiplexes ${apiPods * 10} client connections`],
    ['Pub/Sub messages / s', n(msgs), `5% of requests emit an event · ${workers} worker${workers > 1 ? 's' : ''}`],
    ['AI requests / s', n(aiRps), '0.04% of active users ask the assistant each second'],
    ['AI spend / hour', `$${aiCostHour.toFixed(2)}`, '≈ $0.0001 per cached reply, as measured on Octo'],
  ]

  // Error budget: 99.95% over 28 days = 20.2 minutes of allowed failure
  const burn = !inc || inc.kind === 'release' ? 0.4 : inc.stage === 'down' ? (inc.kind === 'region' ? 14.4 : inc.kind === 'zone' ? 6 : 2) : 1
  const consumed = Math.min(1, 0.22 + (inc && inc.kind !== 'release' ? (inc.kind === 'region' ? 0.14 : inc.kind === 'zone' ? 0.06 : 0.01) : 0))
  const paging = burn >= 6

  const SLOS: [string, string, string][] = [
    ['Availability', '99.95% of valid requests succeed', '28 days · 20.2 min budget'],
    ['API latency', '99% of requests under 300 ms', '28 days'],
    ['AI first token', '95% under 1.5 s', '28 days'],
    ['AI answer quality', '≥ 95% grounded on sampled traffic', 'weekly, judged + human audit'],
    ['Data freshness', '99% of events in BigQuery < 5 min', '28 days'],
    ['Recovery', 'RPO ≤ 5 min · RTO ≤ 15 min', 'proven by quarterly drills'],
  ]

  return (
    <div className="cap">
      <div className="cap-col">
        <div className="cap-head">
          <h4>Capacity model</h4>
          <span>live from the traffic control · assumptions stated, to be validated by load testing</span>
        </div>
        <table className="cap-table">
          <tbody>
            {rows.map(([k, v, how, bad]) => (
              <tr key={k} className={bad ? 'is-alert' : ''}>
                <th>{k}</th>
                <td className="cap-v">{v}</td>
                <td className="cap-how">{how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cap-col">
        <div className="cap-head">
          <h4>SLOs & error budget</h4>
          <span>99.95%, not 99.99%: one primary region caps what can be honestly promised</span>
        </div>
        <table className="cap-table">
          <tbody>
            {SLOS.map(([k, v, w]) => (
              <tr key={k}>
                <th>{k}</th>
                <td className="cap-v is-text">{v}</td>
                <td className="cap-how">{w}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={`cap-budget ${paging ? 'is-alert' : ''}`}>
          <div className="cap-budget-row">
            <span>Error budget consumed (28 days)</span>
            <strong>{pct(consumed)}</strong>
          </div>
          <div className="cap-bar"><i style={{ width: pct(consumed) }} /></div>
          <div className="cap-budget-row">
            <span>Current burn rate</span>
            <strong>{burn.toFixed(1)}×</strong>
          </div>
          <div className="cap-alerts">
            {[
              ['14.4× over 1 h and 5 min', 'page on-call', burn >= 14.4],
              ['6× over 6 h and 30 min', 'page on-call', burn >= 6 && burn < 14.4],
              ['1× over 3 days and 6 h', 'open a ticket', burn >= 1 && burn < 6],
            ].map(([rule, action, on]) => (
              <div key={String(rule)} className={on ? 'cap-alert is-on' : 'cap-alert'}>
                <span>{rule}</span>
                <em>{action}</em>
              </div>
            ))}
          </div>
          <p>Budget exhausted → feature freeze; reliability work takes priority until it recovers. Budget left over funds faster releases.</p>
        </div>
      </div>
    </div>
  )
}

export default CapacityView
