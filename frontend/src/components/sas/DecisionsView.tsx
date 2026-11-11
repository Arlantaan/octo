/**
 * Architecture decision records: what was chosen, what was rejected, why, and the measurable
 * condition that would reopen the decision. The reasoning is the design.
 */

const ADRS: { area: 'Platform' | 'Data' | 'Reliability' | 'AI'; title: string; chose: string; over: string; why: string; revisit: string }[] = [
  {
    area: 'Platform',
    title: 'A modular monolith API, not microservices',
    chose: 'Four deployables split by scaling profile: web, api, ai gateway, workers',
    over: 'One service per domain entity',
    why: 'Each network hop adds latency, failure modes and on-call load. Boundaries live in the code until a team or a scaling profile demands a split.',
    revisit: 'A module needs its own release cadence, team or scaling curve',
  },
  {
    area: 'Platform',
    title: 'GKE for steady traffic, Cloud Run for bursts',
    chose: 'Regional GKE for the hot path; Cloud Run for the AI gateway and jobs',
    over: 'Everything on one runtime',
    why: 'High, steady request rates benefit from bin-packing, the mesh and fine-grained autoscaling; spiky, event-driven work is cheaper scaling to zero.',
    revisit: 'Team under three engineers: move to GKE Autopilot or Cloud Run only',
  },
  {
    area: 'Platform',
    title: 'Everything as code, nothing by console',
    chose: 'Terraform, Config Sync and policy as code for every project, network and workload',
    over: 'Changes made by hand in the console',
    why: 'Reviewed, reproducible and auditable change; drift is detected and reverted; a lost region can be rebuilt from the repository.',
    revisit: 'Never; break-glass console access is sealed and alerted',
  },
  {
    area: 'Data',
    title: 'Cloud SQL Postgres, not Spanner',
    chose: 'Regional HA Postgres with read replicas and PgBouncer',
    over: 'Spanner or AlloyDB from day one',
    why: 'Relational model, mature tooling and far lower cost; the single-primary write ceiling sits well above projected load.',
    revisit: 'Sustained writes above 60% of primary capacity, or multi-region writes required',
  },
  {
    area: 'Data',
    title: 'Transactional outbox, not dual writes',
    chose: 'Events written in the same transaction as the data, relayed to Pub/Sub',
    over: 'Write to the database, then publish',
    why: 'Dual writes lose or invent events whenever one side fails. The outbox plus idempotent consumers turns at-least-once delivery into exactly-once effects.',
    revisit: 'Event volume outgrows the relay: move to change data capture',
  },
  {
    area: 'Reliability',
    title: 'Warm standby, not active-active',
    chose: 'Secondary region with a small warm fleet and a cross-region replica',
    over: 'Two regions serving writes at once',
    why: 'Meets RPO 5 min and RTO 15 min at a fraction of active-active cost and without global write conflicts. Failover is a rehearsed, deliberate operation.',
    revisit: 'The business needs an RTO under a minute or regional data residency',
  },
  {
    area: 'Reliability',
    title: '99.95% SLO, not 99.99%',
    chose: '20 minutes of error budget per 28 days, spent deliberately',
    over: 'Promising four nines',
    why: 'One primary region cannot honestly support four nines, and each extra nine costs roughly ten times more. The budget pays for release velocity.',
    revisit: 'Contracts require higher availability: adopt multi-region writes first',
  },
  {
    area: 'AI',
    title: 'Models through Vertex AI, not a vendor API',
    chose: 'Vertex AI endpoints inside the VPC Service Controls perimeter',
    over: "Calling a model vendor's API directly",
    why: 'Prompts and data stay inside the cloud perimeter, with IAM, billing and audit in one place and regional endpoints for residency.',
    revisit: 'A capability the product needs ships on a vendor API first',
  },
  {
    area: 'AI',
    title: 'Guard rails centralised in an AI gateway',
    chose: 'One gateway for auth, budgets, Model Armor, PII redaction, caching and tracing',
    over: 'Each feature calling the model directly',
    why: 'One enforcement point means consistent policy, per-feature cost attribution, and swapping or routing models without touching product code.',
    revisit: 'Gateway overhead exceeds 50 ms at p95',
  },
  {
    area: 'AI',
    title: 'Retrieval, not fine-tuning',
    chose: 'Hybrid retrieval with reranking, citations and groundedness checks',
    over: 'Fine-tuning the knowledge into a model',
    why: 'Knowledge changes daily, answers must cite sources, and access control must apply per document. Retrieval satisfies all three; fine-tuning satisfies none.',
    revisit: 'Format or style failures that prompting and examples cannot fix',
  },
  {
    area: 'AI',
    title: 'Smallest capable model first',
    chose: 'The small tier by default, escalating to larger tiers on measured difficulty',
    over: 'The largest model for every request',
    why: 'Cost and latency fall several-fold for most traffic. Escalation is decided by a classifier and proven by evals, not by instinct.',
    revisit: 'Evals show the small model failing the quality bar on core tasks',
  },
  {
    area: 'AI',
    title: 'Evals as the release gate for AI behaviour',
    chose: 'Prompts, tools and models versioned and blocked on eval results in CI',
    over: 'Spot-checking outputs by hand',
    why: 'Model behaviour regresses silently. A golden and adversarial suite makes quality, safety and cost measurable on every change.',
    revisit: 'Never; the suite grows with every production failure',
  },
]

const DecisionsView = () => (
  <div className="adr">
    <p className="adr-intro">
      Every box in the architecture is a decision. These are the consequential ones: what was chosen, what was rejected,
      why, and the measurable signal that would reopen it.
    </p>
    <div className="adr-grid">
      {ADRS.map((a, i) => (
        <article key={a.title} className="adr-card">
          <div className="adr-top">
            <span className={`adr-area is-${a.area.toLowerCase()}`}>{a.area}</span>
            <span className="adr-num">ADR-{String(i + 1).padStart(3, '0')}</span>
          </div>
          <h4>{a.title}</h4>
          <dl>
            <dt>Chose</dt>
            <dd>{a.chose}</dd>
            <dt>Over</dt>
            <dd>{a.over}</dd>
            <dt>Because</dt>
            <dd>{a.why}</dd>
            <dt>Revisit when</dt>
            <dd>{a.revisit}</dd>
          </dl>
        </article>
      ))}
    </div>
  </div>
)

export default DecisionsView
