import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import SEO from '../components/SEO'

const ServicesPage = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const services = [
    {
      icon: 'fa-brain',
      title: 'Market Intelligence & Research',
      description: 'Competitor analysis, market research, and business intelligence powered by AI — surfacing the signal your competitors can\'t find and you need to move with confidence.',
    },
    {
      icon: 'fa-pen-nib',
      title: 'Graphic Design',
      description: 'Social media posts, marketing creatives, brand identity and signage — built in Photoshop and Illustrator. Every pixel intentional. Every post designed to convert attention into action.',
    },
    {
      icon: 'fa-chart-line',
      title: 'Data Analysis',
      description: 'You have data. You don\'t have clarity. Dashboards, KPI reports, audience and sales analysis that tell you exactly where to move — navigation clarity, driven by numbers.',
    },
    {
      icon: 'fa-laptop-code',
      title: 'Web & SaaS Development',
      description: 'Websites, e-commerce platforms, web apps and SaaS tools — built, tested, integrated and deployed. Self-taught, AI-accelerated, fully shipped. Hetzner, Contabo, Firebase — affordable hosting that scales.',
    },
  ]

  return (
    <section id="services" className="services-section relative py-16">
      <SEO
        title="Services"
        description="Market intelligence & research, graphic design, data analysis, and web & SaaS development — four disciplines, one operator."
      />
      <div className="services-container relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="services-header"
        >
          <span className="section-label">What I Do</span>
          <h2 className="section-title-main">Four Arms. One Operator.</h2>
          <p className="section-intro">
            If you're a small business, a startup, or a solo operator who needs design, data, development and research — without hiring four different people — this is built for you. Agency quality. Not agency pricing.
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServicesPage

