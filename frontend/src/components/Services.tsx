import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Service } from '../types'

const services: Service[] = [
  {
    id: 'market-intelligence',
    name: 'Market Intelligence & Research',
    description: 'Most people Google. I interrogate. Using AI as a precision research instrument, I surface competitor analysis, market research, and business intelligence that doesn\'t exist in public search — giving you decisions backed by real signal, not noise.',
    icon: 'fa-brain',
    features: ['Competitor Analysis & Audits', 'Market Research Reports', 'Business Intelligence', 'Industry Trend Mapping', 'Audience & Customer Insights'],
    basePrice: 500,
  },
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    description: 'Built in Photoshop and Illustrator — social media posts, marketing creatives, and brand visuals that stop the scroll. Every pixel is intentional. Every post is designed to convert attention into action.',
    icon: 'fa-pen-nib',
    features: ['Social Media Post Design', 'Marketing Creatives', 'Brand Identity & Logos', 'Promotional Materials', 'Print & Digital Assets'],
    basePrice: 300,
  },
  {
    id: 'data-analytics',
    name: 'Data Analysis',
    description: 'You have data. You don\'t have clarity. I extract the signal from the noise — building dashboards, reports, and visual models that tell you exactly where to move. No more guessing. Navigation clarity, driven by numbers.',
    icon: 'fa-chart-line',
    features: ['Business Intelligence Dashboards', 'Performance Tracking & KPIs', 'Data Visualisation', 'Audience & Sales Analysis', 'Actionable Reporting'],
    basePrice: 600,
  },
  {
    id: 'web-development',
    name: 'Web & SaaS Development',
    description: 'Self-taught. AI-accelerated. Fully deployed. I build websites, web applications and SaaS tools from scratch — scripting across languages, integrating APIs, and shipping products that work.',
    icon: 'fa-code',
    features: ['Custom Websites & Landing Pages', 'Web Applications & SaaS', 'API Integration & Scripting', 'E-commerce Solutions', 'Performance Optimisation'],
    basePrice: 1200,
  },
]

const Services = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="services" className="services-section">
      <div className="section-divider"></div>
      <div className="services-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="services-header"
        >
          <span className="section-label">What I Do</span>
          <h2 className="section-title-main">Four Arms. One Operator.</h2>
          <p className="section-intro">
            If you're a small business, a startup, or a solo operator who needs design, data, development and research — without hiring four different people — this is built for you.
          </p>
        </motion.div>

        <div className="services-grid">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface ServiceCardProps {
  service: Service
  index: number
  inView: boolean
}

const ServiceCard = ({ service, index, inView }: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="service-card-modern"
    >
      <div className="service-icon-wrapper">
        <i className={`fas ${service.icon}`}></i>
      </div>
      <div className="service-content">
        <h3 className="service-title-modern">{service.name}</h3>
        <p className="service-description-modern">{service.description}</p>
        <ul className="service-features-list">
          {service.features.map((feature, idx) => (
            <li key={idx} className="service-feature-item">
              <i className="fas fa-check"></i>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default Services

