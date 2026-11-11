import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import SEO from '../components/SEO'

/**
 * Case study: Etikz, Wave payments for event ticketing.
 * Every claim and number here comes from the Etikz codebase and its load-test notes.
 */

const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]
const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-61.8px' },
  transition: { duration: 0.618, ease: EASE_PHI },
}

const FLOW = [
  { t: 'Buyer taps Buy', s: 'seats held for 10 minutes', icon: 'fa-hand-pointer' },
  { t: 'Signed checkout', s: 'request signed for Wave', icon: 'fa-file-signature' },
  { t: 'Pays in Wave', s: 'mobile money, on the phone', icon: 'fa-mobile-screen' },
  { t: 'Payment confirmed', s: 'webhook or direct check', icon: 'fa-shield-halved' },
  { t: 'Settled once', s: 'first receipt wins', icon: 'fa-lock' },
  { t: 'QR ticket issued', s: 'cryptographically signed', icon: 'fa-qrcode' },
  { t: 'Admitted once', s: 'at the gate, by any scanner', icon: 'fa-door-open' },
]

const METRICS = [
  { v: '10×', l: 'more requests per second to Wave from one shared connection: 2.2 to 22.8, measured' },
  { v: '0', l: 'ways for a replayed or duplicated payment notice to create a second ticket' },
  { v: '5 min', l: 'window outside which a payment notice is rejected as a replay' },
  { v: '1', l: 'request to confirm a payment, instead of waiting for Wave to call back' },
]

const DECISIONS = [
  {
    icon: 'fa-chair',
    title: 'Hold the seat, never oversell it',
    problem: 'A ticket drop sends hundreds of buyers at the same tier at once. Two of them must never buy the last seat.',
    did: 'Checkout takes an exclusive lock on the ticket tier, holds the seats for ten minutes and records the hold. A buyer who presses buy twice gets the same checkout back, and a background sweep returns unpaid holds the moment they expire.',
    result: 'Sold out means sold out. And "the last seats are being paid for" is told apart from a sell-out, so a sale is never lost to the wrong message.',
  },
  {
    icon: 'fa-gauge-high',
    title: 'Measure the bottleneck, then remove it',
    problem: 'Holding the tier lock while waiting for Wave made every buyer queue behind one network round trip.',
    did: 'A load-testing harness timed each phase of checkout. It showed 2.4 checkouts per second at peak, falling to 1.0 at fifty concurrent buyers. A switchable design commits the hold first and calls Wave after the lock is released; if Wave fails, the seat is handed back immediately.',
    result: 'The ceiling is set by Wave’s response time, not by a queue inside the platform. Decided by measurement, not by guesswork.',
  },
  {
    icon: 'fa-signature',
    title: 'Trust no payment notice that cannot prove itself',
    problem: 'A webhook that says "paid" is an instruction to issue a ticket. A forged one is a free ticket.',
    did: 'Every notice is verified with an HMAC-SHA256 signature over its timestamp and exact body, compared in constant time, and rejected if older than five minutes. With no secret configured, every notice is refused rather than trusted.',
    result: 'Only Wave can issue a ticket, and a captured notice cannot be replayed later.',
  },
  {
    icon: 'fa-fingerprint',
    title: 'Exactly once, whatever arrives twice',
    problem: 'Payment providers retry. Networks duplicate. The buyer’s page and the webhook can both report the same payment.',
    did: 'Every notice is recorded on receipt and the first one wins. The webhook and the buyer’s page share one settlement path, and fulfilment returns early on an order already paid.',
    result: 'A payment becomes tickets exactly once, no matter how many times it is reported.',
  },
  {
    icon: 'fa-bolt',
    title: 'Don’t keep a paying customer waiting',
    problem: 'The buyer has paid and is watching a spinner, waiting for Wave to call the platform back.',
    did: 'The return page asks Wave directly for the payment status, rate-limited per order so many tabs cannot stampede the provider. An unrecognised status is treated as still in progress, because releasing a seat someone has paid for is the worst outcome.',
    result: 'The ticket appears the moment the payment does: one request instead of an open-ended wait.',
  },
  {
    icon: 'fa-rotate-left',
    title: 'Give failed payments their seats back at once',
    problem: 'Wave omits the order reference on failed-payment notices, so a failed payment could hold its seat until expiry and show "sold out" to real buyers.',
    did: 'Failed notices are matched to their order through the Wave session ID stored at checkout, and the hold is released immediately.',
    result: 'Seats return to sale the moment a payment fails, not ten minutes later.',
  },
]

const Flow = () => {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setStep((s) => (s + 1) % FLOW.length), 1000)
    return () => window.clearInterval(id)
  }, [reduce])
  return (
    <div className="cs-flow" role="list" aria-label="How a payment becomes a ticket">
      {FLOW.map((f, i) => (
        <div key={f.t} role="listitem" className={`cs-step ${!reduce && i === step ? 'is-on' : ''} ${!reduce && i < step ? 'is-done' : ''}`}>
          <span className="cs-step-icon"><i className={`fas ${f.icon}`} aria-hidden="true" /></span>
          <strong>{f.t}</strong>
          <em>{f.s}</em>
        </div>
      ))}
    </div>
  )
}

const CaseStudyEtikz = () => (
  <section className="cs">
    <SEO
      title="Etikz case study: Wave payment integration"
      description="How Etikz turns a Wave mobile money payment into exactly one signed QR ticket: seat holds, signed webhooks, idempotent settlement and measured performance."
      path="/work/etikz"
    />
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Link to="/portfolio" className="cs-back"><i className="fas fa-arrow-left mr-2" aria-hidden="true" />All work</Link>

      <motion.div {...fade} className="cs-hero">
        <div>
          <span className="section-label">Case study · Payment Integration</span>
          <h1 className="cs-title">Etikz: Wave payments that never sell a seat twice</h1>
          <p className="cs-lede">
            A ticketing platform for event promoters in The Gambia. Buyers pay with Wave mobile money and carry a signed QR
            ticket on their phone. Behind that single tap is a payment integration engineered so that every payment becomes
            exactly one ticket, and every ticket is admitted exactly once.
          </p>
          <div className="cs-chips">
            {['Wave Checkout API', 'FastAPI', 'PostgreSQL', 'Redis', 'React', 'TypeScript', 'Docker'].map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
        <div className="cs-shot">
          <img src="/images/portfolio/etikz.webp" alt="Etikz event page with flyer and ticket tiers" width={1440} height={900} />
        </div>
      </motion.div>

      <motion.div {...fade} className="mt-16">
        <h2 className="cs-h2">From tap to gate</h2>
        <p className="cs-p">Seven steps, each one designed to hold under load and under failure.</p>
        <Flow />
      </motion.div>

      <motion.div {...fade} className="aie-metrics mt-16">
        {METRICS.map((m) => (
          <div key={m.l} className="aie-metric">
            <div className="aie-metric-value">{m.v}</div>
            <div className="aie-metric-label">{m.l}</div>
          </div>
        ))}
      </motion.div>

      <div className="mt-20">
        <h2 className="cs-h2">Six engineering decisions</h2>
        <p className="cs-p">Payments are where software errors cost real money. Each decision below answers a specific way a payment can go wrong.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {DECISIONS.map((d, i) => (
            <motion.article key={d.title} {...fade} transition={{ ...fade.transition, delay: (i % 2) * 0.0618 }} className="aie-card">
              <div className="flex items-center gap-3">
                <span className="aie-icon"><i className={`fas ${d.icon}`} /></span>
                <h3 className="text-xl font-bold text-white">{d.title}</h3>
              </div>
              <dl className="cs-dl">
                <dt>Risk</dt>
                <dd>{d.problem}</dd>
                <dt>Design</dt>
                <dd>{d.did}</dd>
                <dt>Outcome</dt>
                <dd>{d.result}</dd>
              </dl>
            </motion.article>
          ))}
        </div>
      </div>

      <motion.div {...fade} className="mt-20 text-center rounded-2xl border border-green-500/25 bg-slate-900/70 p-8 sm:p-12 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Need Wave, Visa or Mastercard in your system?</h2>
        <p className="text-white/70 mt-3">
          The same engineering, applied to your website, app or platform: payments that are verified, reconciled and never
          charged twice.
        </p>
        <div className="mt-6 btn-row">
          <Link to="/quote" className="btn-primary-hero rounded-full">Get a quote</Link>
          <Link to="/ai-lab" className="ai-ghost-btn">Scope your project</Link>
        </div>
      </motion.div>
    </div>
  </section>
)

export default CaseStudyEtikz
