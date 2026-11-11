import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'
import { openOcto } from '../ai/api'
import SystemAtScale from '../components/SystemAtScale'
import ModelEvaluation, { type Verdict } from '../components/ModelEvaluation'

const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]
const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-61.8px' },
  transition: { duration: 0.618, ease: EASE_PHI },
}

// Measured on Octo in production conditions (live API)
const METRICS = [
  { value: '75%', label: 'lower cost per answer once the knowledge base is served from cache' },
  { value: '0.9s', label: 'to first streamed words on a cached request' },
  { value: '$0.0001', label: 'typical cost of a single assistant reply' },
  { value: '5', label: 'independent layers of abuse and spend protection' },
]

interface Discipline {
  icon: string
  title: string
  problem: string
  deliver: string[]
  proof: string
}

// Software Development: every proof line is real, shipped work
const SOFTWARE: Discipline[] = [
  {
    icon: 'fa-window-maximize',
    title: 'Web & SaaS Applications',
    problem: 'Off-the-shelf tools stop fitting the moment a business works its own way, and spreadsheets stop scaling soon after.',
    deliver: [
      'Product websites and web applications built for speed and search',
      'Multi-user SaaS platforms with roles, permissions and audit trails',
      'E-commerce with catalogue, cart, checkout and an admin back office',
    ],
    proof: 'Koya’s platform runs menus, reservations and waiter ordering; Sensation by Sanu sells online with its own product admin.',
  },
  {
    icon: 'fa-database',
    title: 'Backend, APIs & Databases',
    problem: 'The backend is where correctness lives: data integrity, permissions, integrations and every rule the business depends on.',
    deliver: [
      'Well-modelled PostgreSQL: schemas, migrations, indexing and query performance',
      'Typed Python and FastAPI services with REST and streaming APIs',
      'Authentication, role-based access, background jobs and reliable integrations',
    ],
    proof: 'Speed HR runs payroll for about 120 staff across 7 stations on FastAPI and PostgreSQL; Etikz guarantees every ticket is sold and admitted exactly once.',
  },
  {
    icon: 'fa-layer-group',
    title: 'Frontend Engineering',
    problem: 'Users judge the whole system by its interface. Slow, confusing or inaccessible screens undo good engineering underneath.',
    deliver: [
      'React and TypeScript applications, typed end to end',
      'Responsive, accessible interfaces with measured performance',
      'Design systems, so every screen stays consistent as the product grows',
    ],
    proof: 'This site: React and TypeScript on a golden-ratio design system, designed and built by the same hands.',
  },
  {
    icon: 'fa-file-invoice-dollar',
    title: 'Business Systems & Integrations',
    problem: 'Payroll, statutory filings, payments and reporting are where errors cost real money and real trust.',
    deliver: [
      'Payroll, HR and operations systems shaped around local regulation',
      'Payment integration: Wave, Visa, Mastercard and regional gateways',
      'Exports and reports in the exact formats authorities require',
    ],
    proof: 'Speed HR files SSHFC, ICF and GRA PAYE in one click; Etikz takes Wave payments in production; merchant integrations at Wave.',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Quality & Security Engineering',
    problem: 'Software that handles money and personal data must be secure and verifiable by design, not patched after an incident.',
    deliver: [
      'Typed code, code review and automated checks on every change',
      'Least-privilege access, secrets kept out of code, audit logging',
      'Compliance-aware design for KYC, AML and data protection',
    ],
    proof: 'Google Cybersecurity Certificate; KYC, AML, fraud-prevention and monitoring work across fintech at Sourcertz.',
  },
  {
    icon: 'fa-rocket',
    title: 'Delivery & Operations',
    problem: 'Software only creates value once it is deployed, observed and maintained without drama.',
    deliver: [
      'Containerised deployment with Docker on Linux behind Nginx',
      'Repeatable releases, backups and monitoring from the first version',
      'Migrations from legacy platforms without lost data',
    ],
    proof: 'Speed HR runs Dockerised at Ambil Speed; Ambil Speed’s website moved from WordPress to a fast hand-coded build.',
  },
]

const AI: Discipline[] = [
  {
    icon: 'fa-sitemap',
    title: 'AI Strategy & Architecture',
    problem: 'Most AI initiatives fail before a line of code: the wrong problem, the wrong model, or no way to measure success.',
    deliver: [
      'Use-case assessment: where AI creates measurable value and where it does not',
      'Model and vendor selection on capability, cost, latency and data-handling terms',
      'System architecture from prototype to production, including the build-or-buy decision',
    ],
    proof: 'Every engagement begins with the Five Ws, the same method encoded in the Project Scoper.',
  },
  {
    icon: 'fa-terminal',
    title: 'Prompt & Context Engineering',
    problem: 'An assistant is only as dependable as the instructions and context it receives. Ad-hoc prompts drift, hallucinate and break.',
    deliver: [
      'Production system prompts written, versioned and tested like code',
      'Schema-constrained structured output that software can consume without parsing',
      'Grounding rules that make the model decline rather than invent',
    ],
    proof: 'Octo answers only from a curated knowledge pack; the Scoper returns a schema-validated brief on every request.',
  },
  {
    icon: 'fa-book-open',
    title: 'RAG & Knowledge Systems',
    problem: 'General models know nothing about your products, policies or customers, and confidently fill the gap.',
    deliver: [
      'Assistants grounded in your own documents, manuals, policies and data',
      'Retrieval pipelines with source citations, so every answer can be checked',
      'Access controls so each user only reaches the knowledge they are entitled to',
    ],
    proof: 'Octo is a grounded assistant: its answers are drawn from a defined knowledge base, not the open internet.',
  },
  {
    icon: 'fa-robot',
    title: 'Agents & Automation',
    problem: 'The next step beyond chat: AI that acts, by reading systems, filling forms, routing work and triggering processes.',
    deliver: [
      'Agents that operate your own system in plain English, through typed tools',
      'Business rules and approvals enforced in code, never left to the model',
      'Signed-in access only, scoped to what each user is allowed to do',
    ],
    proof: 'Speed HR’s agent runs month-end payroll from plain English: 17 tools that hire, give raises and loans, set pay, approve, print and pay, and it cannot pay a month until every station is confirmed.',
  },
  {
    icon: 'fa-vial-circle-check',
    title: 'Evaluation & Quality Assurance',
    problem: 'Without measurement, "it seems to work" is the only quality standard, and silent regressions reach customers.',
    deliver: [
      'Test suites of representative, edge-case and adversarial inputs',
      'Quality, cost and latency measured on every change to a prompt or model',
      'Prompt-injection and abuse testing before launch',
    ],
    proof: 'Octo’s quality, cost and latency are measured on every reply and against a published evaluation.',
  },
  {
    icon: 'fa-gauge-high',
    title: 'Inference Optimisation',
    problem: 'AI that is too slow or too expensive per request never survives contact with real traffic.',
    deliver: [
      'Model right-sizing: the smallest model that meets the quality bar',
      'Prompt caching, streaming and response-length control',
      'Hard spend ceilings, per-user rate limits and budget monitoring',
    ],
    proof: 'Caching cut Octo’s cost per answer by 75%; a daily and total spend cap means it can never overrun its budget.',
  },
]

const PLATFORM = [
  {
    icon: 'fa-diagram-project',
    title: 'System Design',
    text: 'Architectures specified for the load they must carry: service boundaries, data flow, failure modes and the path from a first version to national scale.',
    proof: 'Grounded in fintech operations: card issuance, real-time transaction alerts and ATM processing at Access Bank, and merchant payments at Wave.',
  },
  {
    icon: 'fa-code-branch',
    title: 'Engineering Practice',
    text: 'Version control, code review, typed interfaces and repeatable releases, so software and AI behaviour change safely and every change can be traced.',
    proof: 'Speed HR, the Koya platform and this site’s AI backend are maintained and released this way.',
  },
  {
    icon: 'fa-cloud',
    title: 'Cloud & Scalability',
    text: 'Containerised deployment, horizontal autoscaling, caching tiers and read replicas, so capacity follows demand up and back down, and cost follows with it.',
    proof: 'Dockerised deployments on Linux servers behind Nginx, with budgets and rate limits enforced at the application tier.',
  },
]

// Conclusions drawn from the published evaluation (src/data/model-eval.json)
const VERDICTS: Verdict[] = [
  {
    role: 'Primary',
    model: 'Model A',
    text: 'Passed every case with first words in under a second, at about $0.18 per thousand answers: 2.4 times faster and 11 times cheaper than the closest alternative.',
  },
  {
    role: 'Fallback',
    model: 'Model B, minimal reasoning',
    text: 'Equally honest and injection-resistant, from a second provider. It answers automatically if the primary is unavailable, so the assistant never goes dark. Raising its reasoning effort bought nothing measurable: same pass rate, 1.6 times slower.',
  },
  {
    role: 'Held in reserve',
    model: 'Model C',
    text: 'Built for agents and long reasoning. At 3.4 seconds and $6.41 per thousand answers it is the wrong tool for a site assistant, and the right one for harder, multi-step work.',
  },
]

const PROCESS = [
  { step: 'Diagnose', text: 'Interrogate the problem through the Five Ws and define what success will be measured against.' },
  { step: 'Prototype', text: 'Build the smallest system that tests the core assumption, with real data, in days rather than months.' },
  { step: 'Evaluate', text: 'Measure quality, cost and latency against the agreed standard before anything reaches users.' },
  { step: 'Deploy', text: 'Ship with guard rails: budgets, rate limits, monitoring and human oversight where it matters.' },
  { step: 'Improve', text: 'Use real-world feedback and measurement to refine the system continuously.' },
]

const SectionHead = ({ label, title, text }: { label: string; title: string; text: string }) => (
  <div className="mt-20 text-center max-w-2xl mx-auto">
    <span className="section-label">{label}</span>
    <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">{title}</h2>
    <p className="text-white/65 mt-3">{text}</p>
  </div>
)

const DisciplineGrid = ({ items }: { items: Discipline[] }) => (
  <div className="mt-10 grid gap-5 md:grid-cols-2">
    {items.map((d, i) => (
      <motion.article key={d.title} {...fade} transition={{ ...fade.transition, delay: (i % 2) * 0.0618 }} className="aie-card">
        <div className="flex items-center gap-3">
          <span className="aie-icon"><i className={`fas ${d.icon}`} /></span>
          <h3 className="text-xl font-bold text-white">{d.title}</h3>
        </div>
        <p className="text-white/65 mt-4 leading-relaxed">{d.problem}</p>
        <ul className="career-points mt-4">
          {d.deliver.map((x) => <li key={x}>{x}</li>)}
        </ul>
        <div className="aie-proof">
          <i className="fas fa-circle-check text-green-400 mr-2" />
          {d.proof}
        </div>
      </motion.article>
    ))}
  </div>
)

const AIEngineering = () => (
  <section className="aie">
    <SEO
      title="AI Engineering & Software Development"
      description="Software development and AI engineering as one discipline: web and SaaS applications, backend and APIs, business systems, RAG, agents, evaluation and production AI, delivered with measured results."
      path="/ai-engineering"
    />
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <motion.div {...fade} className="text-center max-w-3xl mx-auto">
        <h1 className="aie-mark">AIE / SD</h1>
        <p className="aie-mark-sub">AI Engineering &amp; Software Development</p>
        <p className="section-intro">
          One discipline, not two: production software engineered properly, and AI built into it with the same rigour.
          Systems that are well built, grounded in your data, measured against explicit standards, and economical at scale.
        </p>
        <div className="mt-6 btn-row">
          <Link to="/ai-lab" className="btn-primary-hero rounded-full">
            <i className="fas fa-flask mr-2" /> See it running live
          </Link>
          <button
            className="ai-ghost-btn"
            onClick={() => openOcto('What software development and AI engineering services does Abdulla offer, and what would suit my business?')}
          >
            Ask Octo about your project
          </button>
        </div>
      </motion.div>

      {/* Evidence */}
      <motion.div {...fade} className="aie-metrics">
        {METRICS.map((m) => (
          <div key={m.label} className="aie-metric">
            <div className="aie-metric-value">{m.value}</div>
            <div className="aie-metric-label">{m.label}</div>
          </div>
        ))}
      </motion.div>
      <p className="text-center text-xs text-white/40 mt-3">Measured on Octo, the AI assistant running on this site.</p>

      {/* Software Development */}
      <SectionHead
        label="SD"
        title="Software Development"
        text="The systems that run the business, AI or not. The foundation everything else stands on: there is no dependable AI without dependable software beneath it."
      />
      <DisciplineGrid items={SOFTWARE} />

      {/* AI Engineering */}
      <SectionHead
        label="AIE"
        title="AI Engineering"
        text="From foundation model to production system: AI built into real software, with the evidence to prove it."
      />
      <DisciplineGrid items={AI} />

      {/* Model evaluation */}
      <SectionHead
        label="Model evaluation"
        title="Measured, not claimed"
        text="Choosing a model is an engineering decision, so it is made on evidence. Octo’s own workload, run through leading models from two providers under identical conditions."
      />
      <ModelEvaluation verdicts={VERDICTS} />

      {/* Systems at scale */}
      <SectionHead
        label="Systems at Scale"
        title="Engineered for millions, economical at thousands"
        text="AI engineering is software engineering first. Below is the whole system behind an AI product, in eight views: infrastructure, failure handling, data correctness, capacity and SLOs, AI serving, the AI lifecycle, governance, and the decisions that shape them."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PLATFORM.map((p, i) => (
          <motion.article key={p.title} {...fade} transition={{ ...fade.transition, delay: i * 0.0618 }} className="aie-card">
            <div className="flex items-center gap-3">
              <span className="aie-icon"><i className={`fas ${p.icon}`} /></span>
              <h3 className="text-xl font-bold text-white">{p.title}</h3>
            </div>
            <p className="text-white/65 mt-4 leading-relaxed">{p.text}</p>
            <div className="aie-proof">
              <i className="fas fa-circle-check text-green-400 mr-2" />
              {p.proof}
            </div>
          </motion.article>
        ))}
      </div>
      <motion.div {...fade} className="mt-8 sas-wide">
        <SystemAtScale />
        <p className="text-center text-xs text-white/40 mt-3">
          Illustrative simulation of a reference architecture, not a system in production. Figures are stated design assumptions and
          failover is time-compressed. Drag the traffic control or run a drill to watch every view respond.
        </p>
      </motion.div>

      {/* Process */}
      <motion.div {...fade} className="mt-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center">How an engagement runs</h2>
        <ol className="aie-process">
          {PROCESS.map((p, i) => (
            <li key={p.step}>
              <span className="aie-step-num">{String(i + 1).padStart(2, '0')}</span>
              <div className="font-bold text-white mt-2">{p.step}</div>
              <p className="text-sm text-white/65 mt-1.5 leading-relaxed">{p.text}</p>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* CTA */}
      <motion.div {...fade} className="mt-20 text-center rounded-2xl border border-green-500/25 bg-slate-900/70 p-8 sm:p-12 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Define the problem. We will engineer the system.</h2>
        <p className="text-white/70 mt-3">
          Software, AI or both: describe it in the Project Scoper and receive a structured brief in seconds, or start the conversation directly.
        </p>
        <div className="mt-6 btn-row">
          <Link to="/ai-lab" className="btn-primary-hero rounded-full">Scope your project</Link>
          <Link to="/contact" className="ai-ghost-btn">Contact</Link>
        </div>
      </motion.div>
    </div>
  </section>
)

export default AIEngineering
