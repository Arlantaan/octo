// Shared types and SVG primitives for the Systems at Scale diagrams

export const PHI = 1.618
export const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]

export type Outage = 'down' | 'failover' | 'recovering'
export type ReleaseStage = 'build' | 'canary' | 'progressive' | 'complete'
export type Incident =
  | null
  | { kind: 'instance'; stage: 'down' | 'replacing' }
  | { kind: 'zone'; stage: Outage }
  | { kind: 'region'; stage: Outage }
  | { kind: 'release'; stage: ReleaseStage }

export const RELEASE_SHARE: Record<ReleaseStage, number> = { build: 0, canary: 0.1, progressive: 0.5, complete: 1 }

/** Live state every view renders from */
export interface SimState {
  users: number
  level: number
  instances: number
  workers: number
  incident: Incident
  reduce: boolean
}

export type Tone = 'default' | 'accent' | 'alert' | 'muted' | 'security' | 'dim' | 'release'

export const Node = ({
  x,
  y,
  w = 150,
  h = 58,
  title,
  sub,
  tone = 'default',
}: {
  x: number
  y: number
  w?: number
  h?: number
  title: string
  sub: string
  tone?: Tone
}) => (
  <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
    <rect width={w} height={h} rx={12} className={`sas-node is-${tone}`} />
    <text x={w / 2} y={h / 2 - 5} textAnchor="middle" className="sas-title">{title}</text>
    <text x={w / 2} y={h / 2 + 13} textAnchor="middle" className={tone === 'alert' ? 'sas-sub is-alert' : 'sas-sub'}>{sub}</text>
  </g>
)

/** A titled background band (security, control plane, pipelines) */
export const Band = ({ x, y, w, h, title, tone }: { x: number; y: number; w: number; h: number; title: string; tone?: 'security' }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={18} className={tone ? `sas-band is-${tone}` : 'sas-band'} />
    <text x={x + 18} y={y + 18} className="sas-region-title">{title}</text>
  </g>
)

/** Packets flowing along an existing path id */
export const Packets = ({ path, count, dur, reduce }: { path: string; count: number; dur: number; reduce: boolean }) =>
  reduce ? null : (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle key={`${path}-${count}-${i}`} r={3} fill="url(#sas-packet)">
          <animateMotion dur={`${dur}s`} begin={`${(i / count) * dur}s`} repeatCount="indefinite">
            <mpath href={`#${path}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  )

export const PacketGradient = () => (
  <defs>
    <radialGradient id="sas-packet">
      <stop offset="0" stopColor="#d1fae5" />
      <stop offset="0.382" stopColor="#4ade80" />
      <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
    </radialGradient>
  </defs>
)

/** Evenly spaced x centres for n items across [x0, x0 + width] */
export const spread = (n: number, x0: number, width: number) => Array.from({ length: n }, (_, i) => x0 + (width / n) * (i + 0.5))

export const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}
export const vcurve = (x1: number, y1: number, x2: number, y2: number) => {
  const my = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`
}

/** A titled panel with plain text lines (for mechanisms, checklists and live figures) */
export const Panel = ({
  x,
  y,
  w,
  h,
  title,
  lines,
  tone,
  lineGap = 20,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
  lines: string[]
  tone?: Tone
  lineGap?: number
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height={h} rx={14} className={`sas-node is-${tone ?? 'default'}`} />
    <text x={16} y={26} className="sas-title">{title}</text>
    {lines.map((l, i) => (
      <text key={i} x={16} y={52 + i * lineGap} className="sas-line">{l}</text>
    ))}
  </g>
)

/** Small horizontal meter used for live gauges */
export const Meter = ({ x, y, w, value, tone }: { x: number; y: number; w: number; value: number; tone: 'ok' | 'warn' | 'bad' }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={w} height={8} rx={4} className="sas-meter-track" />
    <rect width={Math.max(4, Math.min(1, value) * w)} height={8} rx={4} className={`sas-meter is-${tone}`} />
  </g>
)
