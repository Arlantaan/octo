import { Band, Node, PacketGradient, Packets, SimState, Tone, spread, vcurve } from './common'

/**
 * The landing zone around the workload: resource hierarchy, Shared VPC, centralised logging,
 * organisation policies, the signed release pipeline with progressive delivery, and access and cost
 * controls. The "Ship a release" drill walks a change from commit to 100% of production.
 */

const ORG = { x: 740, y: 72 }
const FOLDERS = [
  ['Production', 'strictest policies'],
  ['Non-production', 'staging · dev'],
  ['Shared services', 'network · delivery'],
  ['Security & audit', 'restricted access'],
]
const PROJECTS = [
  ['prod-app', 'GKE · Cloud Run', 0],
  ['prod-data', 'Cloud SQL · BigQuery', 0],
  ['staging-app', 'mirror of prod', 1],
  ['dev-app', 'ephemeral previews', 1],
  ['network-host', 'Shared VPC host', 2],
  ['delivery', 'Cloud Build · registry', 2],
  ['logging', 'aggregated log sinks', 3],
  ['security', 'SCC · KMS keyrings', 3],
] as const

const FX = spread(4, 20, 1440)
const PX = spread(8, 20, 1440)
const FY = 182
const PY = 300

const PIPELINE = [
  ['Pull request', 'review · tests required'],
  ['Cloud Build', 'tests · SAST · SBOM'],
  ['Artifact Registry', 'vulnerability scanning'],
  ['Binary Authorization', 'attest & sign image'],
  ['Cloud Deploy · dev', 'automatic'],
  ['Cloud Deploy · staging', 'smoke + load tests'],
  ['Cloud Deploy · prod', 'canary · auto-rollback'],
]

const OrgView = ({ incident: inc, reduce }: SimState) => {
  const release = inc?.kind === 'release' ? inc.stage : null
  // How far along the pipeline the release has reached
  const reached = release === 'build' ? 4 : release === 'canary' ? 7 : release === 'progressive' || release === 'complete' ? 7 : 0
  const prodShare = release === 'canary' ? '10%' : release === 'progressive' ? '50%' : release === 'complete' ? '100%' : null
  const pipeTone = (i: number): Tone => (release && i < reached ? 'release' : 'default')

  return (
    <svg viewBox="0 0 1480 960" role="img" aria-label="Google Cloud landing zone: resource hierarchy, policies, release pipeline and governance.">
      <PacketGradient />

      {/* Hierarchy */}
      {FX.map((x, i) => <path key={i} d={vcurve(ORG.x, ORG.y + 29, x, FY - 29)} className="sas-control" />)}
      {PROJECTS.map(([, , f], i) => <path key={i} d={vcurve(FX[f], FY + 29, PX[i], PY - 29)} className="sas-control" />)}
      <Node x={ORG.x} y={ORG.y} w={240} title="Organization · octopustech.org" sub="org policies inherited by everything below" tone="accent" />
      {FOLDERS.map(([t, s], i) => <Node key={t} x={FX[i]} y={FY} w={200} title={`Folder · ${t}`} sub={s} tone="muted" />)}
      {PROJECTS.map(([t, s], i) => <Node key={t} x={PX[i]} y={PY} w={160} title={t} sub={s} tone={i === 6 || i === 7 ? 'security' : 'default'} />)}

      {/* Shared VPC attachments and log sinks */}
      {[0, 1, 2, 3].map((i) => (
        <path key={`vpc-${i}`} d={`M ${PX[4]} ${PY + 29} C ${PX[4]} 372, ${PX[i]} 372, ${PX[i]} ${PY + 29}`} className="sas-edge is-standby" />
      ))}
      <path id="org-logs" d={`M ${PX[0]} ${PY + 29} C ${PX[0]} 392, ${PX[6]} 392, ${PX[6]} ${PY + 29}`} className="sas-control is-replication" />
      <Packets path="org-logs" count={3} dur={4.236} reduce={reduce} />
      <text x={PX[0] - 70} y={414} className="sas-vpc-title">Shared VPC: one network owned by network-host, attached to every app project</text>
      <text x={PX[7] + 70} y={414} textAnchor="end" className="sas-vpc-title">every project's logs → locked, retained buckets in logging</text>

      {/* Organisation policies */}
      <Band x={20} y={430} w={1440} h={100} title="Organisation policy constraints" tone="security" />
      {[
        ['Resource locations', 'EU regions only'],
        ['No external IPs', 'on any VM or node'],
        ['No service-account keys', 'Workload Identity only'],
        ['Uniform bucket access', 'no per-object ACLs'],
        ['Domain-restricted sharing', 'org identities only'],
        ['OS Login required', 'IAM-controlled SSH'],
      ].map(([t, s], i) => <Node key={t} x={spread(6, 20, 1440)[i]} y={490} w={220} h={50} title={t} sub={s} tone="security" />)}

      {/* Release pipeline */}
      <Band x={20} y={556} w={1440} h={170} title="Release pipeline · every change signed, tested and rolled out progressively" />
      {(() => {
        const xs = spread(7, 20, 1440)
        return PIPELINE.map(([t, s], i) => (
          <g key={t}>
            {i > 0 && <path id={`org-p-${i}`} d={`M ${xs[i - 1] + 90} 632 L ${xs[i] - 90} 632`} className={release && i < reached ? 'sas-edge' : 'sas-control'} />}
            {i > 0 && release && i < reached && <Packets path={`org-p-${i}`} count={2} dur={0.854} reduce={reduce} />}
            <Node x={xs[i]} y={632} w={180} title={t} sub={i === 6 && prodShare ? `canary at ${prodShare} · SLOs green` : s} tone={pipeTone(i)} />
          </g>
        ))
      })()}
      {(() => {
        const x0 = spread(7, 20, 1440)[6]
        return (
          <g>
            {['10%', '50%', '100%'].map((p, i) => {
              const on = prodShare && ['10%', '50%', '100%'].indexOf(prodShare) >= i
              return (
                <g key={p} transform={`translate(${x0 - 81 + i * 56} 676)`}>
                  <rect width={50} height={20} rx={10} className={on ? 'org-step is-on' : 'org-step'} />
                  <text x={25} y={14} textAnchor="middle" className="k8s-pod-label">{p}</text>
                </g>
              )
            })}
          </g>
        )
      })()}
      <text x={40} y={712} className="sas-vpc-title">Terraform creates every project, network and policy from reviewed code · error-budget burn halts a rollout and rolls it back automatically</text>

      {/* Access and cost */}
      <Band x={20} y={752} w={1440} h={196} title="Access & cost governance" />
      {[
        ['Groups → IAM roles', 'no grants to individuals', 'security'],
        ['Privileged Access Manager', 'just-in-time, time-boxed', 'security'],
        ['Break-glass accounts', 'sealed · alert on any use', 'security'],
        ['Billing export → BigQuery', 'cost per service and label', 'default'],
        ['Budgets & alerts', 'per project · 50 / 90 / 100%', 'default'],
        ['Committed use discounts', 'on the steady base load', 'default'],
        ['Labels on everything', 'team · env · service · cost centre', 'default'],
        ['Recommender', 'idle and oversized resources', 'default'],
        ['Access reviews', 'quarterly · least privilege', 'security'],
        ['Separate state per env', 'Terraform · locked backends', 'default'],
        ['Policy as code', 'checked before every apply', 'security'],
        ['Disaster-recovery drills', 'region failover rehearsed', 'default'],
      ].map(([t, s, tone], i) => (
        <Node key={t} x={spread(6, 20, 1440)[i % 6]} y={i < 6 ? 806 : 880} w={222} h={56} title={t} sub={s} tone={tone as Tone} />
      ))}
    </svg>
  )
}

export default OrgView
