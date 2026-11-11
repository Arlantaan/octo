import { AnimatePresence, motion } from 'framer-motion'
import { Band, EASE_PHI, Node, PacketGradient, Packets, RELEASE_SHARE, SimState, Tone, spread } from './common'

/**
 * Inside the GKE regional cluster: managed control plane, three zones, two node pools, pods per
 * deployment (HPA), nodes per zone (cluster autoscaler), Workload Identity to Google APIs, and the
 * Kubernetes guarantees that keep it safe. Reacts to the same traffic and drills as the overview.
 */

type App = 'web' | 'api' | 'ai' | 'worker'
interface Pod {
  key: string
  app: App
  v2: boolean
  failed: boolean
  fresh: boolean
}

const ZONES = ['europe-west1-b', 'europe-west1-c', 'europe-west1-d']
const CL = { x: 230, y: 40, w: 990, h: 620 }
const ZTOP = 196
const ZH = 440
const ZW = 310
const ZX = (i: number) => CL.x + 20 + i * (ZW + 15)
const PODS_PER_NODE = 6
const VM_H = 58
const APP_LABEL: Record<App, string> = { web: 'web', api: 'api', ai: 'ai', worker: 'job' }

const CONTROL_PLANE = [
  ['kube-apiserver', 'private endpoint'],
  ['etcd', 'replicated · managed'],
  ['Scheduler', 'zone-aware placement'],
  ['Controllers', 'reconcile desired state'],
  ['Policy Controller', 'admission policies'],
  ['Binary Authorization', 'signed images only'],
]

const GOOGLE_APIS = [
  ['Cloud SQL', 'Auth Proxy sidecar · IAM'],
  ['Memorystore', 'Private Service Connect'],
  ['Pub/Sub', 'HPA on queue depth'],
  ['Vertex AI', 'LLM inference · embeddings'],
  ['Secret Manager', 'CSI driver · no env secrets'],
  ['Artifact Registry', 'image streaming · scanned'],
  ['Cloud Logging & Trace', 'OpenTelemetry collector'],
]

const VMLabel = ({ pool, zone, i }: { pool: 'general' | 'spot'; zone: number; i: number }) =>
  `gke-${pool}-${'bcd'[zone]}-${String(i + 1).padStart(2, '0')} · ${pool === 'general' ? 'n2-standard-8' : 'e2-standard-4 spot'}`

const KubernetesView = ({ users, instances, workers, incident: inc, reduce }: SimState) => {
  // Desired replicas per deployment (HPA output)
  const replicas: Record<App, number> = {
    api: instances * 2,
    web: instances,
    ai: Math.ceil(instances / 2) + 1,
    worker: workers * 2,
  }
  const zoneOut = inc?.kind === 'zone' && inc.stage !== 'recovering'
  const zoneSurge = inc?.kind === 'zone' && inc.stage === 'down'
  const regionOut = inc?.kind === 'region' && inc.stage !== 'recovering'
  const share = inc?.kind === 'release' ? RELEASE_SHARE[inc.stage] : 0
  const live = zoneOut && !zoneSurge ? [0, 2] : [0, 1, 2]

  // Topology spread: replicas round-robin over live zones; during the surge, zone c's pods are Pending
  const zonePods: Pod[][] = [[], [], []]
  let pending = 0
  ;(Object.keys(replicas) as App[]).forEach((app) => {
    for (let i = 0; i < replicas[app]; i++) {
      const z = live[i % live.length]
      if (zoneSurge && z === 1) {
        pending++
        continue
      }
      zonePods[z].push({
        key: `${app}-${i}`,
        app,
        v2: app !== 'worker' && i < Math.round(share * replicas[app]),
        failed: inc?.kind === 'instance' && inc.stage === 'down' && app === 'api' && i === 0,
        fresh: inc?.kind === 'instance' && inc.stage === 'replacing' && app === 'api' && i === 0,
      })
    }
  })

  // Cluster autoscaler: enough VMs in each pool to fit the pods
  const vms = zonePods.map((pods) => {
    const general = pods.filter((p) => p.app !== 'worker')
    const spot = pods.filter((p) => p.app === 'worker')
    const chunk = (list: Pod[]) => Array.from({ length: Math.ceil(list.length / PODS_PER_NODE) }, (_, i) => list.slice(i * PODS_PER_NODE, (i + 1) * PODS_PER_NODE))
    return [...chunk(general).map((p, n) => ({ pool: 'general' as const, n, pods: p })), ...chunk(spot).map((p, n) => ({ pool: 'spot' as const, n, pods: p }))]
  })
  const totalNodes = vms.reduce((s, z) => s + z.length, 0)
  const totalPods = zonePods.reduce((s, z) => s + z.length, 0)

  const zoneDown = (z: number) => regionOut || (zoneOut && z === 1)
  const intensity = Math.min(1, users / 2_400_000)
  const pkt = Math.max(1, Math.round(1 + 4 * intensity))

  const chip = (id: string): Tone => {
    if (inc?.kind === 'instance' && id === 'probes') return inc.stage === 'down' ? 'alert' : 'accent'
    if (inc?.kind === 'zone' && (id === 'spread' || id === 'ca')) return 'accent'
    if (inc?.kind === 'release' && (id === 'rolling' || id === 'pdb')) return 'release'
    if (id === 'hpa' || id === 'ca') return 'accent'
    return 'muted'
  }
  const CHIPS: [string, string, string][] = [
    ['hpa', 'Horizontal Pod Autoscaler', `${replicas.api} api · ${replicas.web} web · ${replicas.ai} ai pods`],
    ['ca', 'Cluster autoscaler', `${totalNodes} nodes across 2 node pools`],
    ['pdb', 'PodDisruptionBudgets', 'minAvailable 75% in upgrades'],
    ['spread', 'Topology spread', 'replicas balanced across zones'],
    ['probes', 'Health probes', inc?.kind === 'instance' && inc.stage === 'down' ? 'liveness failed · restarting' : 'readiness · liveness · startup'],
    ['rolling', 'Rolling updates', 'maxSurge 25% · maxUnavailable 0'],
    ['netpol', 'NetworkPolicy', 'default deny · Dataplane V2'],
    ['pss', 'Pod Security Standards', 'restricted · non-root · RO fs'],
    ['res', 'Requests & limits', 'sized from VPA recommendations'],
    ['gitops', 'Config Sync', 'GitOps · drift auto-corrected'],
    ['backup', 'Backup for GKE', 'workloads + volumes · daily'],
    ['channel', 'Release channel', 'Regular · surge node upgrades'],
  ]

  return (
    <svg viewBox="0 0 1480 830" role="img" aria-label={`Inside a GKE regional cluster: ${totalPods} pods on ${totalNodes} nodes across three zones.`}>
      <PacketGradient />

      {/* Ingress chain */}
      {[
        ['Global HTTPS LB', 'Cloud Armor attached', 250],
        ['GKE Gateway API', 'HTTPRoute · managed TLS', 380],
        ['Container-native LB', 'NEGs → pod IPs directly', 510],
      ].map(([t, s, y], i) => (
        <g key={String(t)}>
          {i > 0 && <path id={`k8s-in-${i}`} d={`M 115 ${Number(y) - 101} L 115 ${Number(y) - 29}`} className="sas-edge" />}
          <Node x={115} y={Number(y)} w={170} title={String(t)} sub={String(s)} />
        </g>
      ))}
      {[0, 1, 2].map((z) => (
        <path key={z} id={`k8s-z-${z}`} d={`M 115 539 C 115 668, ${ZX(z) + ZW / 2} 668, ${ZX(z) + ZW / 2} ${ZTOP + ZH}`} className={zoneDown(z) ? 'sas-edge is-cut' : 'sas-edge'} />
      ))}

      {/* Cluster boundary */}
      <rect x={CL.x} y={CL.y} width={CL.w} height={CL.h} rx={20} className={regionOut ? 'sas-region is-down' : 'sas-region'} />
      <text x={CL.x + 18} y={CL.y + 22} className="sas-region-title">
        GKE regional cluster · europe-west1 · private nodes · Dataplane V2 · Cloud Service Mesh mTLS
      </text>
      <rect x={CL.x + 14} y={CL.y + 34} width={CL.w - 28} height={110} rx={14} className="sas-vpc" />
      <text x={CL.x + 30} y={CL.y + 52} className="sas-vpc-title">Control plane · Google-managed · replicated across zones</text>
      {spread(6, CL.x + 14, CL.w - 28).map((x, i) => (
        <Node key={i} x={x} y={CL.y + 100} w={150} h={52} title={CONTROL_PLANE[i][0]} sub={CONTROL_PLANE[i][1]} tone="muted" />
      ))}

      {/* Zones, node pools, pods */}
      {[0, 1, 2].map((z) => {
        const down = zoneDown(z)
        return (
          <g key={z} transform={`translate(${ZX(z)} ${ZTOP})`}>
            <rect width={ZW} height={ZH} rx={16} className={down ? 'sas-zone is-down' : 'sas-zone'} />
            <text x={ZW / 2} y={22} textAnchor="middle" className={down ? 'sas-zone-title is-down' : 'sas-zone-title'}>
              {down ? `${ZONES[z]} · UNAVAILABLE` : ZONES[z]}
            </text>
            {down && zoneSurge && z === 1 && (
              <text x={ZW / 2} y={ZH / 2} textAnchor="middle" className="sas-sub is-alert">{pending} pods Pending · rescheduling</text>
            )}
            {down && regionOut && z === 1 && (
              <text x={ZW / 2} y={ZH / 2} textAnchor="middle" className="sas-sub is-alert">Region down · DR cluster in europe-west4 serving</text>
            )}
            <AnimatePresence>
              {!down &&
                vms[z].map((vm, vi) => (
                  <motion.g
                    key={`${vm.pool}-${vi}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.618, ease: EASE_PHI } }}
                    exit={{ opacity: 0, transition: { duration: 0.382 } }}
                  >
                    <g transform={`translate(12 ${38 + vi * (VM_H + 8)})`}>
                      <rect width={ZW - 24} height={VM_H} rx={10} className={vm.pool === 'spot' ? 'k8s-vm is-spot' : 'k8s-vm'} />
                      <text x={10} y={15} className="k8s-vm-label">{VMLabel({ pool: vm.pool, zone: z, i: vm.n })}</text>
                      {vm.pods.map((p, pi) => (
                        <g key={p.key} transform={`translate(${10 + pi * 45} 24)`}>
                          <rect width={40} height={24} rx={5} className={`k8s-pod is-${p.app} ${p.v2 ? 'is-v2' : ''} ${p.failed ? 'is-failed' : p.fresh ? 'is-fresh' : ''}`} />
                          <text x={20} y={16} textAnchor="middle" className="k8s-pod-label">
                            {p.failed ? 'crash' : `${APP_LABEL[p.app]}${p.v2 ? '·v2' : ''}`}
                          </text>
                        </g>
                      ))}
                    </g>
                  </motion.g>
                ))}
            </AnimatePresence>
          </g>
        )
      })}

      {!reduce &&
        [1, 2].map((i) => <Packets key={i} path={`k8s-in-${i}`} count={pkt} dur={1.618} reduce={reduce} />)}
      {[0, 1, 2].filter((z) => !zoneDown(z)).map((z) => (
        <Packets key={z} path={`k8s-z-${z}`} count={pkt} dur={2.618} reduce={reduce} />
      ))}

      {/* Workload Identity to Google APIs */}
      <text x={1350} y={60} textAnchor="middle" className="sas-region-title">Workload Identity</text>
      <text x={1350} y={76} textAnchor="middle" className="sas-vpc-title">no keys · one service account per app</text>
      {GOOGLE_APIS.map(([t, s], i) => {
        const y = 136 + i * 76
        return (
          <g key={t}>
            <path d={`M ${CL.x + CL.w} ${y} L 1255 ${y}`} className="sas-control" />
            <Node x={1350} y={y} w={190} title={t} sub={s} tone={regionOut ? 'dim' : 'default'} />
          </g>
        )
      })}

      {/* Kubernetes guarantees */}
      <Band x={30} y={682} w={1420} h={140} title="Kubernetes guarantees" />
      {CHIPS.map(([id, t, s], i) => {
        const x = spread(6, 30, 1420)[i % 6]
        const y = i < 6 ? 726 : 784
        return <Node key={id} x={x} y={y} w={222} h={50} title={t} sub={s} tone={chip(id)} />
      })}

      {/* Pod legend */}
      <g transform="translate(30 64)">
        <text x={0} y={0} className="sas-region-title">Pods</text>
        {(['web', 'api', 'ai', 'worker'] as App[]).map((a, i) => (
          <g key={a} transform={`translate(0 ${16 + i * 30})`}>
            <rect width={40} height={22} rx={5} className={`k8s-pod is-${a}`} />
            <text x={20} y={15} textAnchor="middle" className="k8s-pod-label">{APP_LABEL[a]}</text>
            <text x={50} y={15} className="sas-sub">{a === 'worker' ? 'worker (spot pool)' : a === 'ai' ? 'AI gateway' : a}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export default KubernetesView
