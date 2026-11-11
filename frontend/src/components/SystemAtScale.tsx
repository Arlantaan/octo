import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Band, EASE_PHI, Incident, Node, PHI, RELEASE_SHARE, SimState, Tone, curve, spread } from './sas/common'
import KubernetesView from './sas/KubernetesView'
import AIPlatformView from './sas/AIPlatformView'
import OrgView from './sas/OrgView'
import ResilienceView from './sas/ResilienceView'
import CapacityView from './sas/CapacityView'
import AILifecycleView from './sas/AILifecycleView'
import DecisionsView from './sas/DecisionsView'

/**
 * Complete reference architecture for a production web + AI platform, in four linked views:
 *
 *  Architecture   edge → regional platform across three zones → data, AI and async tiers,
 *                 warm-standby DR region, security controls and the control plane
 *  Inside GKE     control plane, node pools, pods per deployment, Workload Identity, guarantees
 *  AI platform    the guarded request pipeline, retrieval, ingestion, LLMOps, latency budget
 *  Organisation   resource hierarchy, Shared VPC, org policies, signed progressive delivery
 *
 * One simulated traffic level and one set of drills (instance, zone, region, release) drive every
 * view. Illustrative, not a live system.
 */

const PHASES = [
  { users: 4_000, label: 'Quiet hours' },
  { users: 120_000, label: 'Morning ramp-up' },
  { users: 900_000, label: 'Campaign launch' },
  { users: 2_400_000, label: 'Peak: millions online' },
  { users: 600_000, label: 'Traffic subsiding' },
  { users: 40_000, label: 'Scaling back in' },
]
const MIN_USERS = 2_000
const MAX_USERS = 2_400_000
const PER_INSTANCE_RPS = 16_000
const DR_WARM = 2

const fromLevel = (l: number) => Math.round(MIN_USERS * Math.pow(MAX_USERS / MIN_USERS, l))
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}k` : `${Math.round(n)}`
const toLevel = (u: number) => Math.log(u / MIN_USERS) / Math.log(MAX_USERS / MIN_USERS)

type Provider = 'generic' | 'gcp'
type View = 'architecture' | 'kubernetes' | 'resilience' | 'capacity' | 'ai' | 'lifecycle' | 'org' | 'decisions'
const VIEWS: [View, string, string][] = [
  ['architecture', 'Architecture', 'complete reference architecture'],
  ['kubernetes', 'Inside GKE', 'inside the GKE regional cluster'],
  ['resilience', 'Resilience & data', 'overload control and data correctness'],
  ['capacity', 'Capacity & SLOs', 'the numbers behind the design'],
  ['ai', 'AI serving', 'the guarded AI request pipeline'],
  ['lifecycle', 'AI lifecycle', 'evals, retrieval quality, agents and model strategy'],
  ['org', 'Organisation', 'landing zone, policy and delivery'],
  ['decisions', 'Decisions', 'architecture decision records'],
]

// ---------- Labels: cloud-agnostic and Google Cloud ----------
const LABELS: Record<string, Record<Provider, [string, string]>> = {
  dns: { generic: ['DNS', 'geo · latency routing'], gcp: ['Cloud DNS', 'DNSSEC · geo routing'] },
  edge: { generic: ['Edge / CDN', 'TLS · WAF · DDoS'], gcp: ['Cloud CDN', 'Armor WAF · DDoS · bots'] },
  lb: { generic: ['Global load balancer', 'anycast · health checks'], gcp: ['Global HTTPS LB', 'anycast IP · managed certs'] },
  api: { generic: ['API gateway', 'auth · quotas · routing'], gcp: ['GKE Gateway API', 'HTTPRoute · NEGs'] },
  auth: { generic: ['Identity & auth', 'OAuth · sessions · RBAC'], gcp: ['Identity Platform', 'OIDC · MFA · RBAC'] },
  gateway: { generic: ['AI gateway', 'budgets · guard rails · cache'], gcp: ['AI gateway', 'Model Armor · PII redaction'] },
  cache: { generic: ['Redis cache', 'sessions · hot data'], gcp: ['Memorystore Redis', 'HA · sessions · hot data'] },
  queue: { generic: ['Message queue', 'durable · retry · DLQ'], gcp: ['Pub/Sub', 'at-least-once · DLQ'] },
  db: { generic: ['PostgreSQL HA', 'primary + standby'], gcp: ['Cloud SQL Postgres', 'regional HA'] },
  storage: { generic: ['Object storage', 'files · media · backups'], gcp: ['Cloud Storage', 'dual-region · versioned'] },
  vector: { generic: ['Vector database', 'RAG retrieval'], gcp: ['Vertex Vector Search', 'ANN · RAG retrieval'] },
  model: { generic: ['Model API', 'primary · fallback model'], gcp: ['LLM on Vertex AI', 'primary · fallback region'] },
  workers: { generic: ['Workers', 'email · webhooks · jobs'], gcp: ['Cloud Run jobs', 'email · webhooks · batch'] },
  warehouse: { generic: ['Data warehouse', 'CDC · event streams'], gcp: ['BigQuery', 'Datastream CDC · Dataflow'] },
  scheduler: { generic: ['Scheduler', 'cron · delayed tasks'], gcp: ['Cloud Scheduler', '+ Cloud Tasks · Eventarc'] },
  drFleet: { generic: ['Standby fleet', 'warm standby'], gcp: ['GKE warm standby', 'europe-west4'] },
  drDb: { generic: ['Cross-region replica', 'async replication'], gcp: ['Cloud SQL replica', 'cross-region'] },
  sec1: { generic: ['Identity & access', 'least privilege · no static keys'], gcp: ['IAM · Workload Identity', 'least privilege · no static keys'] },
  sec2: { generic: ['Zero-trust admin access', 'no VPN · no bastion hosts'], gcp: ['Identity-Aware Proxy', 'no VPN · no bastion hosts'] },
  sec3: { generic: ['Service mesh', 'mTLS · service-to-service authz'], gcp: ['Cloud Service Mesh', 'mTLS · service-to-service authz'] },
  sec4: { generic: ['Network perimeter', 'private subnets · egress control'], gcp: ['VPC Service Controls', 'data exfiltration perimeter'] },
  sec5: { generic: ['Key management', 'encryption at rest & in transit'], gcp: ['Cloud KMS (CMEK)', 'customer-managed keys'] },
  sec6: { generic: ['Supply-chain policy', 'only signed images deploy'], gcp: ['Binary Authorization', 'only signed images deploy'] },
  sec7: { generic: ['LLM firewall', 'prompt injection · jailbreaks'], gcp: ['Model Armor', 'prompt injection · jailbreaks'] },
  sec8: { generic: ['PII redaction', 'before prompts and logs'], gcp: ['Sensitive Data Protection', 'PII redaction · prompts & logs'] },
  sec9: { generic: ['Threat detection', 'posture · vulnerabilities'], gcp: ['Security Command Center', 'posture · threats · vulns'] },
  sec10: { generic: ['Audit logging', 'who did what, and when'], gcp: ['Cloud Audit Logs', 'locked · retained · exported'] },
  cicd: { generic: ['CI/CD pipeline', 'test · build · canary deploy'], gcp: ['Cloud Build → Deploy', 'signed · canary · rollback'] },
  iac: { generic: ['Infrastructure as Code', 'versioned · reviewed'], gcp: ['Terraform', 'every resource from code'] },
  secrets: { generic: ['Secrets manager', 'rotated · never in code'], gcp: ['Secret Manager', 'rotated · never in code'] },
  autoscaler: { generic: ['Autoscaler', 'targets steady load'], gcp: ['HPA + cluster autoscaler', 'targets steady load'] },
  obs: { generic: ['Observability', 'metrics · logs · traces'], gcp: ['Cloud Monitoring', 'logs · traces · uptime checks'] },
  alerts: { generic: ['Alerts & on-call', 'SLO burn-rate paging'], gcp: ['SLO alerting', 'burn-rate paging · on-call'] },
  cost: { generic: ['Cost governance', 'budgets · forecasts'], gcp: ['Budgets & billing export', 'spend caps · BigQuery'] },
}

// ---------- Layout (viewBox 1480 × 960) ----------
const MID = 325
const COL1 = 1015
const COL2 = 1200
const ZX = 745
const ZW = 160
const ZH = 128
const ZYS = [125, 261, 397]
const ZBOTTOM = ZYS[2] + ZH
const JX = 925
const DRX = 1390
const CP_Y = 890

const P = {
  users: { x: 60, y: MID },
  dns: { x: 190, y: MID },
  edge: { x: 330, y: MID },
  lb: { x: 480, y: MID },
  api: { x: 650, y: MID },
  auth: { x: COL1, y: 125 },
  gateway: { x: COL1, y: 205 },
  cache: { x: COL1, y: 285 },
  queue: { x: COL1, y: 365 },
  db: { x: COL1, y: 445 },
  storage: { x: COL1, y: 525 },
  vector: { x: COL2, y: 165 },
  model: { x: COL2, y: 245 },
  workers: { x: COL2, y: 365 },
  warehouse: { x: COL2, y: 445 },
  scheduler: { x: COL2, y: 525 },
  drFleet: { x: DRX, y: 200 },
  drDb: { x: DRX, y: 445 },
}
const SEC_X = spread(5, 30, 1420)
const SEC = Array.from({ length: 10 }, (_, i) => ({ id: `sec${i + 1}`, x: SEC_X[i % 5], y: i < 5 ? 714 : 776 }))
const CP = ['cicd', 'iac', 'secrets', 'autoscaler', 'obs', 'alerts', 'cost'].map((id, i) => ({ id, x: 120 + i * 205 }))

type Scope = 'global' | 'primary' | 'zoneC' | 'dr'
type EdgeDef = { id: string; d: string; weight: number; scope: Scope }
const DATA_EDGES: EdgeDef[] = [
  { id: 'u-dns', d: 'M 98 325 L 135 325', weight: 1, scope: 'global' },
  { id: 'dns-edge', d: 'M 245 325 L 270 325', weight: 1, scope: 'global' },
  { id: 'edge-lb', d: 'M 390 325 L 415 325', weight: 0.618, scope: 'global' },
  { id: 'lb-api', d: 'M 545 325 L 585 325', weight: 0.618, scope: 'primary' },
  ...ZYS.map((zy, z) => ({ id: `api-z${z}`, d: curve(715, MID, ZX, zy + ZH / 2), weight: 0.5, scope: (z === 1 ? 'zoneC' : 'primary') as Scope })),
  ...ZYS.map((zy, z) => ({ id: `z${z}-j`, d: curve(ZX + ZW, zy + ZH / 2, JX, MID), weight: 0.5, scope: (z === 1 ? 'zoneC' : 'primary') as Scope })),
  ...(['auth', 'gateway', 'cache', 'queue', 'db', 'storage'] as const).map((k, i) => ({
    id: `j-${k}`,
    d: curve(JX, MID, COL1 - 75, P[k].y),
    weight: [0.236, 0.236, 0.382, 0.236, 0.236, 0.146][i],
    scope: 'primary' as Scope,
  })),
  { id: 'gw-vec', d: curve(COL1 + 75, P.gateway.y, COL2 - 75, P.vector.y), weight: 0.146, scope: 'primary' },
  { id: 'gw-model', d: curve(COL1 + 75, P.gateway.y, COL2 - 75, P.model.y), weight: 0.146, scope: 'primary' },
  { id: 'q-workers', d: `M ${COL1 + 75} ${P.queue.y} L ${COL2 - 75} ${P.workers.y}`, weight: 0.236, scope: 'primary' },
  { id: 'workers-wh', d: `M ${COL2} ${P.workers.y + 29} L ${COL2} ${P.warehouse.y - 29}`, weight: 0.146, scope: 'primary' },
  { id: 'db-wh', d: `M ${COL1 + 75} ${P.db.y} L ${COL2 - 75} ${P.warehouse.y}`, weight: 0.09, scope: 'primary' },
  { id: 'sched-q', d: curve(COL2 - 75, P.scheduler.y, COL1 + 75, P.queue.y + 14), weight: 0.09, scope: 'primary' },
  { id: 'lb-dr', d: `M 480 296 C 480 16, ${DRX} 16, ${DRX} ${P.drFleet.y - 29}`, weight: 0.618, scope: 'dr' },
  { id: 'dr-db', d: `M ${DRX} ${P.drFleet.y + 29} L ${DRX} ${P.drDb.y - 29}`, weight: 0.236, scope: 'dr' },
]
const CONTROL_EDGES = [
  { id: 'cicd', d: `M 120 ${CP_Y - 29} C 120 610, 780 610, 780 ${ZBOTTOM + 2}` },
  { id: 'iac', d: `M 325 ${CP_Y - 29} C 325 600, 480 600, 480 ${MID + 31}` },
  { id: 'secrets', d: `M 530 ${CP_Y - 29} C 530 620, 810 620, 810 ${ZBOTTOM + 2}` },
  { id: 'autoscaler', d: `M 735 ${CP_Y - 29} C 735 630, 840 630, 840 ${ZBOTTOM + 2}` },
  { id: 'obs', d: `M 870 ${ZBOTTOM + 2} C 870 630, 940 630, 940 ${CP_Y - 29}` },
  { id: 'obs-auto', d: `M 855 ${CP_Y} L 820 ${CP_Y}` },
  { id: 'obs-alerts', d: `M 1025 ${CP_Y} L 1060 ${CP_Y}` },
  { id: 'alerts-cost', d: `M 1230 ${CP_Y} L 1265 ${CP_Y}` },
  { id: 'replication', d: `M ${COL1} ${P.db.y + 29} C ${COL1} 612, ${DRX} 612, ${DRX} ${P.drDb.y + 29}` },
  { id: 'backup', d: `M ${COL1 - 40} ${P.db.y + 29} L ${COL1 - 40} ${P.storage.y - 29}` },
]

// ---------- Availability zone ----------
interface ZoneProps {
  title: string
  prefix: string
  y: number
  count: number
  down: boolean
  failedIndex: number | null
  freshIndex: number | null
  v2Count: number
}
const Zone = ({ title, prefix, y, count, down, failedIndex, freshIndex, v2Count }: ZoneProps) => {
  const rows = Math.ceil(count / 2)
  const rowH = 30
  const top = 30 + (ZH - 36 - rows * rowH) / 2
  return (
    <g transform={`translate(${ZX} ${y})`}>
      <rect width={ZW} height={ZH} rx={16} className={down ? 'sas-zone is-down' : 'sas-zone'} />
      <text x={ZW / 2} y={20} textAnchor="middle" className={down ? 'sas-zone-title is-down' : 'sas-zone-title'}>
        {down ? 'UNAVAILABLE' : title}
      </text>
      <AnimatePresence>
        {!down &&
          Array.from({ length: count }, (_, i) => {
            const lonely = count % 2 === 1 && i === count - 1
            const gx = lonely ? 47 : 12 + (i % 2) * 76
            const gy = top + Math.floor(i / 2) * rowH
            const cls = failedIndex === i ? 'is-failed' : freshIndex === i ? 'is-fresh' : i < v2Count ? 'is-v2' : ''
            return (
              <motion.g
                key={`${prefix}-${i}`}
                initial={{ opacity: 0, scale: 0.382 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.618, ease: EASE_PHI, delay: (i % 4) * 0.0618 } }}
                exit={{ opacity: 0, scale: 0.382, transition: { duration: 0.382, ease: EASE_PHI } }}
                style={{ transformOrigin: `${gx + 33}px ${gy + 11}px` }}
              >
                <rect x={gx} y={gy} width={66} height={22} rx={6} className={`sas-instance ${cls}`} />
                <circle cx={gx + 10} cy={gy + 11} r={3} className={`sas-led ${cls}`} />
                <text x={gx + 19} y={gy + 15} className="sas-inst-label">{prefix}-{String(i + 1).padStart(2, '0')}</text>
              </motion.g>
            )
          })}
      </AnimatePresence>
    </g>
  )
}

// ---------- Component ----------
const SystemAtScale = () => {
  const reduce = Boolean(useReducedMotion())
  const [view, setView] = useState<View>('architecture')
  const [provider, setProvider] = useState<Provider>('gcp')
  const [auto, setAuto] = useState(true)
  const [phase, setPhase] = useState(0)
  const [level, setLevel] = useState(toLevel(PHASES[0].users))
  const [incident, setIncident] = useState<Incident>(null)
  const timers = useRef<number[]>([])
  const L = (key: string) => LABELS[key][provider]

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  const failInstance = useCallback(() => {
    if (incident) return
    setIncident({ kind: 'instance', stage: 'down' })
    later(1800, () => setIncident({ kind: 'instance', stage: 'replacing' }))
    later(3400, () => setIncident(null))
  }, [incident])

  // Zone and region outages share one shape: surge → failover → recovery
  const outage = useCallback(
    (kind: 'zone' | 'region') => {
      if (incident) return
      setIncident({ kind, stage: 'down' })
      later(2400, () => setIncident({ kind, stage: 'failover' }))
      later(7000, () => setIncident({ kind, stage: 'recovering' }))
      later(8600, () => setIncident(null))
    },
    [incident],
  )

  // A release: build and sign, canary, progressive rollout, complete
  const ship = useCallback(() => {
    if (incident) return
    setIncident({ kind: 'release', stage: 'build' })
    later(1800, () => setIncident({ kind: 'release', stage: 'canary' }))
    later(4000, () => setIncident({ kind: 'release', stage: 'progressive' }))
    later(6400, () => setIncident({ kind: 'release', stage: 'complete' }))
    later(8000, () => setIncident(null))
  }, [incident])

  // Auto mode walks a day of traffic (one phase per 2φ seconds), rehearses an instance failure at peak
  // and ships a release once traffic has scaled back in
  useEffect(() => {
    if (!auto) return
    setLevel(toLevel(PHASES[phase].users))
    if (phase === 3) failInstance()
    if (phase === 5) ship()
    const id = window.setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), 1000 * PHI * 2)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, phase])

  const users = fromLevel(level)
  const inc = incident
  const instanceDown = inc?.kind === 'instance' && inc.stage === 'down'
  const zoneOut = inc?.kind === 'zone' && inc.stage !== 'recovering'
  const zoneSurge = inc?.kind === 'zone' && inc.stage === 'down'
  const regionOut = inc?.kind === 'region' && inc.stage !== 'recovering'
  const regionSurge = inc?.kind === 'region' && inc.stage === 'down'
  const share = inc?.kind === 'release' ? RELEASE_SHARE[inc.stage] : 0

  const m = useMemo(() => {
    const rps = users * 0.08
    const needed = Math.min(12, Math.max(3, Math.ceil(rps / PER_INSTANCE_RPS)))
    // Spread evenly over three zones; zone c is the one the drill takes out
    let zones = [0, 1, 2].map((z) => Math.floor(needed / 3) + (z < needed % 3 ? 1 : 0))
    let dr = DR_WARM
    if (zoneOut) zones = zoneSurge ? [zones[0], 0, zones[2]] : [Math.ceil(needed / 2), 0, Math.floor(needed / 2)]
    if (regionOut) {
      zones = [0, 0, 0]
      dr = regionSurge ? DR_WARM : needed
    }
    const serving = regionOut ? dr : zones.reduce((s, n) => s + n, 0) - (instanceDown ? 1 : 0)
    const load = rps / (Math.max(1, serving) * PER_INSTANCE_RPS)
    const crossRegion = regionOut ? 38 : 0
    const p95 = Math.round(118 + crossRegion + 40 * Math.min(1, load) + (load > 1 ? 90 * Math.min(4, load - 1) : 0))
    const errorRate = regionSurge ? 1.2 : zoneSurge ? 0.6 : instanceDown ? 0.35 : regionOut ? 0.08 : zoneOut ? 0.05 : 0.01
    const availability = regionSurge ? 99.9 : zoneSurge ? 99.93 : instanceDown ? 99.96 : regionOut || zoneOut ? 99.97 : 99.99
    return {
      rps,
      needed,
      zones,
      dr,
      serving,
      workers: Math.min(6, Math.max(1, Math.ceil(rps / 40_000))),
      replicas: Math.min(3, Math.max(1, Math.ceil(rps / 60_000))),
      p95,
      errorRate,
      availability,
    }
  }, [users, zoneOut, zoneSurge, regionOut, regionSurge, instanceDown])

  const label = !inc
    ? auto
      ? PHASES[phase].label
      : users > 1_000_000
        ? 'Peak: millions online'
        : users > 100_000
          ? 'High load'
          : 'Light load'
    : inc.kind === 'instance'
      ? inc.stage === 'down'
        ? 'Instance failure: health check draining it'
        : 'Replacement instance healthy'
      : inc.kind === 'zone'
        ? inc.stage === 'down'
          ? 'Zone outage: two surviving zones absorbing traffic'
          : inc.stage === 'failover'
            ? 'Zone failover complete: capacity restored'
            : 'Zone restored: rebalancing'
        : inc.kind === 'region'
          ? inc.stage === 'down'
            ? 'Region outage: rerouting to DR region (time-compressed)'
            : inc.stage === 'failover'
              ? 'Serving from DR region: replica promoted to primary'
              : 'Primary region restored: failing back'
          : inc.stage === 'build'
            ? 'Release v2: building, scanning and signing the image'
            : inc.stage === 'canary'
              ? 'Canary: v2 serving 10% of traffic, SLOs watched'
              : inc.stage === 'progressive'
                ? 'Progressive rollout: v2 at 50%'
                : 'Release complete: v2 at 100%, zero downtime'

  const alerting = Boolean(inc && inc.stage === 'down')
  const intensity = 0.15 + 0.85 * level
  const packetDur = 2.6 - 1.2 * level

  const edgeLive = (e: EdgeDef) => {
    if (e.scope === 'dr') return regionOut
    if (e.scope === 'global') return true
    if (regionOut) return false
    if (e.scope === 'zoneC') return !zoneOut
    return true
  }
  const edgeClass = (e: EdgeDef) => {
    if (e.scope === 'dr') return regionOut ? 'sas-edge' : 'sas-edge is-standby'
    return edgeLive(e) ? 'sas-edge' : 'sas-edge is-cut'
  }

  const zoneNames = provider === 'gcp' ? ['b', 'c', 'd'] : ['a', 'b', 'c']
  const zoneTitle = (z: number) => (provider === 'gcp' ? `europe-west1-${zoneNames[z]} · GKE` : `ZONE ${zoneNames[z].toUpperCase()}`)
  const releaseSub = inc?.kind === 'release'
    ? { build: 'building · scanning · signing', canary: 'canary at 10% · SLOs green', progressive: 'rolling out · 50%', complete: 'v2 at 100%' }[inc.stage]
    : null

  const sim: SimState = { users, level, instances: m.needed, workers: m.workers, incident: inc, reduce }

  return (
    <div className="sas">
      <div className="sas-toolbar">
        <div>
          <div className={`sas-phase ${alerting ? 'is-alert' : ''}`} aria-live="polite">{label}</div>
          <div className="text-xs text-white/45">Simulation · {VIEWS.find((v) => v[0] === view)?.[2]}</div>
        </div>
        {view === 'architecture' && (
          <div className="sas-seg" role="group" aria-label="Cloud provider">
            {(['gcp', 'generic'] as const).map((p) => (
              <button key={p} className={provider === p ? 'is-on' : ''} onClick={() => setProvider(p)} aria-pressed={provider === p}>
                {p === 'gcp' ? 'Google Cloud' : 'Cloud-agnostic'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sas-tabs" role="tablist" aria-label="Diagram view">
        {VIEWS.map(([id, name]) => (
          <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'is-on' : ''} onClick={() => setView(id)}>
            {name}
          </button>
        ))}
      </div>

      <div className="sas-controls mt-4">
        <label className="sas-slider">
          <i className="fas fa-user-group" aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(level * 1000)}
            onChange={(e) => {
              setAuto(false)
              setLevel(Number(e.target.value) / 1000)
            }}
            aria-label="Simulated traffic"
          />
        </label>
        <button className={`sas-toggle ${auto ? 'is-on' : ''}`} onClick={() => setAuto((v) => !v)} aria-pressed={auto}>
          <i className={`fas ${auto ? 'fa-pause' : 'fa-play'}`} aria-hidden="true" /> {auto ? 'Auto' : 'Manual'}
        </button>
        <span className="sas-sep" aria-hidden="true" />
        <button className="sas-toggle is-drill" onClick={failInstance} disabled={Boolean(inc)}>
          <i className="fas fa-server" aria-hidden="true" /> Fail an instance
        </button>
        <button className="sas-toggle is-drill" onClick={() => outage('zone')} disabled={Boolean(inc)}>
          <i className="fas fa-triangle-exclamation" aria-hidden="true" /> Zone outage
        </button>
        <button className="sas-toggle is-drill" onClick={() => outage('region')} disabled={Boolean(inc)}>
          <i className="fas fa-earth-europe" aria-hidden="true" /> Region outage
        </button>
        <button className="sas-toggle is-ship" onClick={ship} disabled={Boolean(inc)}>
          <i className="fas fa-code-branch" aria-hidden="true" /> Ship a release
        </button>
      </div>

      <div className="sas-metrics">
        {[
          ['Active users', fmt(users), false],
          ['Requests / s', fmt(m.rps), false],
          ['Serving instances', String(m.serving), false],
          ['Queue workers', String(m.workers), false],
          ['Read replicas', String(m.replicas), false],
          ['p95 latency', `${m.p95} ms`, m.p95 > 200],
          ['Error rate', `${m.errorRate.toFixed(2)}%`, m.errorRate > 0.1],
          ['Availability · SLO 99.95%', `${m.availability.toFixed(2)}%`, m.availability < 99.95],
        ].map(([k, v, bad]) => (
          <div key={String(k)} className={`sas-metric ${bad ? 'is-alert' : ''}`}>
            <div className="sas-metric-v">{v}</div>
            <div className="sas-metric-k">{k}</div>
          </div>
        ))}
      </div>

      <div className="sas-canvas">
        {view === 'kubernetes' && <KubernetesView {...sim} />}
        {view === 'ai' && <AIPlatformView {...sim} />}
        {view === 'org' && <OrgView {...sim} />}
        {view === 'resilience' && <ResilienceView {...sim} />}
        {view === 'capacity' && <CapacityView {...sim} />}
        {view === 'lifecycle' && <AILifecycleView {...sim} />}
        {view === 'decisions' && <DecisionsView />}
        {view === 'architecture' && (
          <svg
            viewBox="0 0 1480 960"
            role="img"
            aria-label={`${provider === 'gcp' ? 'Google Cloud' : 'Cloud-agnostic'} reference architecture serving ${fmt(users)} active users across three zones and a disaster-recovery region.`}
          >
            <defs>
              <radialGradient id="sas-packet">
                <stop offset="0" stopColor="#d1fae5" />
                <stop offset="0.382" stopColor="#4ade80" />
                <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Boundaries: primary region, VPC, DR region, bands */}
            <rect x={560} y={40} width={740} height={600} rx={20} className={regionOut ? 'sas-region is-down' : 'sas-region'} />
            <text x={576} y={60} className="sas-region-title">
              {provider === 'gcp' ? 'Primary region · europe-west1 · prod-app project' : 'Primary region'}
            </text>
            <rect x={572} y={72} width={718} height={556} rx={16} className="sas-vpc" />
            <text x={588} y={92} className="sas-vpc-title">
              {provider === 'gcp' ? 'Shared VPC · private subnets · Cloud NAT · Private Service Connect · Private Google Access' : 'Private network · private subnets · NAT egress'}
            </text>
            <rect x={1320} y={40} width={140} height={600} rx={20} className={regionOut ? 'sas-dr is-active' : 'sas-dr'} />
            <text x={DRX} y={60} textAnchor="middle" className="sas-region-title">{provider === 'gcp' ? 'DR · europe-west4' : 'DR region'}</text>
            <g className="sas-targets">
              <text x={DRX} y={520} textAnchor="middle" className="sas-region-title">Targets</text>
              {['RPO ≤ 5 min', 'RTO ≤ 15 min', provider === 'gcp' ? 'PITR · 7 days' : 'point-in-time restore', provider === 'gcp' ? 'Backup for GKE' : 'workload backups', 'failover rehearsed'].map((t, i) => (
                <text key={t} x={DRX} y={542 + i * 18} textAnchor="middle" className="sas-sub">{t}</text>
              ))}
            </g>
            <Band x={30} y={660} w={1420} h={150} title="Security & governance" tone="security" />
            <Band x={30} y={825} w={1420} h={120} title="Control plane" />

            {/* Control-plane and replication links */}
            {CONTROL_EDGES.map((e) => (
              <path
                key={e.id}
                d={e.d}
                className={`sas-control ${alerting && (e.id === 'obs' || e.id === 'obs-alerts') ? 'is-alert' : ''} ${e.id === 'replication' ? 'is-replication' : ''}`}
              />
            ))}

            {/* Data-plane links */}
            {DATA_EDGES.map((e) => (
              <path key={e.id} id={`sas-${e.id}`} d={e.d} className={edgeClass(e)} style={{ strokeOpacity: edgeLive(e) ? 0.28 + 0.4 * intensity * e.weight : undefined }} />
            ))}

            {/* Request packets */}
            {!reduce &&
              DATA_EDGES.filter(edgeLive).map((e) => {
                const surge = (zoneOut && /^(api-z[02]|z[02]-j)$/.test(e.id)) || e.scope === 'dr' ? 1.618 : 1
                const count = Math.max(1, Math.round((1 + 6 * intensity * e.weight) * surge))
                return Array.from({ length: count }, (_, i) => (
                  <circle key={`${e.id}-${count}-${i}`} r={2.4 + 1.4 * Math.min(1, e.weight)} fill="url(#sas-packet)">
                    <animateMotion dur={`${e.scope === 'dr' ? packetDur * 1.618 : packetDur}s`} begin={`${(i / count) * packetDur}s`} repeatCount="indefinite">
                      <mpath href={`#sas-${e.id}`} />
                    </animateMotion>
                  </circle>
                ))
              })}

            {/* Edge path */}
            <g transform={`translate(${P.users.x} ${P.users.y})`}>
              <circle r={38} className="sas-users" />
              <text y={-4} textAnchor="middle" className="sas-title">{fmt(users)}</text>
              <text y={14} textAnchor="middle" className="sas-sub">users</text>
            </g>
            <Node {...P.dns} w={110} title={L('dns')[0]} sub={L('dns')[1]} />
            <Node {...P.edge} w={120} title={L('edge')[0]} sub={L('edge')[1]} />
            <Node {...P.lb} w={130} title={L('lb')[0]} sub={regionOut ? 'rerouting to DR' : L('lb')[1]} tone={regionOut ? 'accent' : 'default'} />
            <Node {...P.api} w={130} title={L('api')[0]} sub={L('api')[1]} tone={regionOut ? 'dim' : 'default'} />

            {/* Three availability zones */}
            {ZYS.map((zy, z) => (
              <Zone
                key={z}
                title={zoneTitle(z)}
                prefix={zoneNames[z]}
                y={zy}
                count={m.zones[z]}
                down={regionOut || (zoneOut && z === 1)}
                failedIndex={instanceDown && z === 0 ? 0 : null}
                freshIndex={inc?.kind === 'instance' && inc.stage === 'replacing' && z === 0 ? 0 : null}
                v2Count={Math.round(share * m.zones[z])}
              />
            ))}
            <circle cx={JX} cy={MID} r={5} className="sas-junction" />

            {/* Regional services */}
            {(['auth', 'cache', 'queue', 'storage', 'workers', 'warehouse', 'scheduler'] as const).map((k) => (
              <Node
                key={k}
                {...P[k]}
                title={k === 'workers' ? `${L(k)[0]} ×${m.workers}` : L(k)[0]}
                sub={L(k)[1]}
                tone={regionOut ? 'dim' : 'default'}
              />
            ))}
            <Node {...P.db} title={L('db')[0]} sub={`HA · PITR · ${m.replicas} replica${m.replicas > 1 ? 's' : ''}`} tone={regionOut ? 'dim' : 'default'} />
            {(['gateway', 'vector', 'model'] as const).map((k) => (
              <Node key={k} {...P[k]} title={L(k)[0]} sub={L(k)[1]} tone={regionOut ? 'dim' : 'accent'} />
            ))}

            {/* DR region */}
            <Node
              {...P.drFleet}
              w={120}
              title={L('drFleet')[0]}
              sub={regionOut ? `${m.dr} instances serving` : `${L('drFleet')[1]} · ${DR_WARM} warm`}
              tone={regionOut ? 'accent' : 'muted'}
            />
            <Node
              {...P.drDb}
              w={120}
              title={L('drDb')[0]}
              sub={regionOut && inc?.stage !== 'down' ? 'promoted to primary' : L('drDb')[1]}
              tone={regionOut && inc?.stage !== 'down' ? 'accent' : 'muted'}
            />

            {/* Security & governance */}
            {SEC.map((s) => (
              <Node key={s.id} x={s.x} y={s.y} w={250} h={52} title={L(s.id)[0]} sub={L(s.id)[1]} tone="security" />
            ))}

            {/* Control plane */}
            {CP.map((c) => {
              const alert = alerting && (c.id === 'obs' || c.id === 'alerts')
              const busy = Boolean(inc) && inc?.kind !== 'release' && c.id === 'autoscaler'
              const shipping = c.id === 'cicd' && releaseSub
              const tone: Tone = alert ? 'alert' : shipping ? 'release' : busy ? 'accent' : 'muted'
              return (
                <Node
                  key={c.id}
                  x={c.x}
                  y={CP_Y}
                  w={170}
                  title={L(c.id)[0]}
                  sub={alert ? (c.id === 'obs' ? 'anomaly detected' : 'paging on-call') : shipping ? releaseSub : busy ? 'adding capacity' : L(c.id)[1]}
                  tone={tone}
                />
              )
            })}
          </svg>
        )}
      </div>

      {view === 'architecture' && (
        <div className="sas-legend">
          <span><i className="sas-key is-data" /> Request path</span>
          <span><i className="sas-key is-standby" /> Standby route</span>
          <span><i className="sas-key is-control" /> Control plane</span>
          <span><i className="sas-key is-replication" /> Replication</span>
          <span><i className="sas-key is-ai" /> AI tier</span>
          <span><i className="sas-key is-sec" /> Security</span>
          <span><i className="sas-key is-release" /> Release</span>
          <span><i className="sas-key is-alert" /> Incident</span>
        </div>
      )}
    </div>
  )
}

export default SystemAtScale
