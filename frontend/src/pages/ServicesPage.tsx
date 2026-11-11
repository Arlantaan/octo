import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import SEO from '../components/SEO'

const ServicesPage = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const services = [
    {
      icon: 'fa-window-maximize',
      title: 'Web Development',
      description: 'High-performance websites, e-commerce and web applications, engineered for speed, search and conversion, and deployed on infrastructure that scales with demand.',
      points: ['Websites and web applications', 'E-commerce with back-office admin', 'Performance, SEO and accessibility'],
    },
    {
      icon: 'fa-server',
      title: 'Software Development',
      description: 'Business systems, SaaS platforms, backends and integrations that carry real operations: payroll, payments, reporting and every rule the business depends on.',
      points: ['SaaS platforms and business systems', 'APIs, integrations and data pipelines', 'System design, cloud and scalability'],
    },
    {
      icon: 'fa-brain',
      title: 'AI Engineering',
      description: 'Production AI built into software with the same rigour: grounded assistants, agents and automation, measured against explicit standards and economical at scale.',
      points: ['RAG assistants on your own data', 'Agents and workflow automation', 'Evaluation, guard rails and cost control'],
    },
    {
      icon: 'fa-credit-card',
      title: 'Payment Integration',
      description: 'Accept mobile money and cards in your website, app or platform: Wave, Visa, Mastercard and regional gateways, integrated securely, reconciled automatically and built to never charge a customer twice.',
      points: ['Wave checkout, merchant payments and payouts', 'Visa and Mastercard through card gateways', 'Signed webhooks, reconciliation and refunds'],
    },
  ]

  return (
    <section id="services" className="services-section relative py-16">
      <SEO
        title="Services"
        description="Web development, software development, AI engineering and payment integration: four disciplines under a single method, from first principle to production."
      />
      <div className="services-container relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="services-header"
        >
          <span className="section-label">Capabilities</span>
          <h2 className="section-title-main">Four Disciplines. One Method.</h2>
          <p className="section-intro">
            Web, software, AI and payments engineered as one system rather than fragmented across vendors. Institutional quality, without institutional overhead.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group h-full rounded-2xl border border-white/10 bg-slate-900/60 p-7 sm:p-8 text-left transition-colors duration-300 hover:border-green-500/40"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                  <i className={`fas ${service.icon} text-xl`}></i>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {service.title}
                </h3>
              </div>
              <p className="text-white/70 leading-relaxed text-base">
                {service.description}
              </p>
              <ul className="career-points mt-5">
                {service.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesPage

