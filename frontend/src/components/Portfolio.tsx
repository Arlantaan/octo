import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

type Category = 'Websites' | 'Platforms' | 'Design' | 'Apps & Automation'

interface Project {
  title: string
  client: string
  category: Category
  summary: string
  stack: string[]
  status: string
  image?: string
  /** Tailwind object-position for screenshots wider than the card (keeps logos/headlines in view) */
  imagePosition?: string
  icon?: string
  liveUrl?: string
  /** Internal case-study page */
  caseStudy?: string
}

// Real projects only. A "Live" status is used only where the site has been confirmed online.
const projects: Project[] = [
  {
    title: 'Koya Restaurant',
    client: 'Koya, The Gambia',
    category: 'Websites',
    summary:
      'An integrated hospitality platform: a public website with a digital menu, table reservations and customer accounts, coupled to a waiter ordering system for the floor. Designed, engineered and deployed end to end.',
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'JavaScript'],
    status: 'Live',
    image: '/images/portfolio/koya.webp',
    liveUrl: 'https://koyagambia.com',
  },
  {
    title: 'Ambil Speed Petroleum',
    client: 'Ambil Speed, The Gambia',
    category: 'Websites',
    summary:
      'Corporate web presence for a national fuel retailer, with a station locator, bulk-supply and delivery enquiries and direct WhatsApp contact. Migrated from WordPress to a hand-engineered, mobile-first build.',
    stack: ['HTML', 'CSS', 'JavaScript', 'PHP'],
    status: 'Live',
    image: '/images/portfolio/ambil-speed.webp',
    liveUrl: 'https://ambilspeed.com',
  },
  {
    title: 'Sensation by Sanu',
    client: 'Sensation by Sanu',
    category: 'Websites',
    summary:
      'Direct-to-consumer commerce for a Gambian perfume house: catalogue, cart and checkout, supported by a dedicated back office for product and media management.',
    stack: ['React', 'TypeScript', 'Zustand', 'Python API'],
    status: 'Client project',
    image: '/images/portfolio/sensation.webp',
  },
  {
    title: 'Coconut Residence Digital Menu',
    client: 'Coconut Residence',
    category: 'Websites',
    summary:
      'A QR-accessed à la carte menu for a hotel, with search, category navigation and Dalasi pricing, rendered in the property’s visual identity.',
    stack: ['JavaScript', 'Firebase', 'Cloudflare Workers'],
    status: 'Client project',
    image: '/images/portfolio/coconut-menu.webp',
  },
  {
    title: 'Speed HR',
    client: 'Ambil Speed, The Gambia',
    category: 'Platforms',
    summary:
      'An HR and payroll system operating across the company’s station network: workforce records, monthly payroll and staff loans, with statutory SSHFC, ICF and GRA PAYE submissions generated in a single action as PDF or Excel.',
    stack: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Docker'],
    status: 'In use',
    image: '/images/portfolio/speed-hr.webp',
    imagePosition: 'object-left-top',
  },
  {
    title: 'Etikz',
    client: 'Event ticketing, The Gambia',
    category: 'Platforms',
    summary:
      'A ticketing platform for event promoters. Buyers pay with Wave and carry a signed QR ticket on their phone; promoters run sales, guest lists and a live door view; bouncers scan at the gate, where every ticket is admitted exactly once, even with two scanners on the same QR.',
    stack: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    status: 'Production-ready',
    image: '/images/portfolio/etikz.webp',
    caseStudy: '/work/etikz',
    imagePosition: 'object-top',
  },
  {
    title: 'Trust Quality Designs',
    client: 'Branding & signage company',
    category: 'Websites',
    summary:
      'The digital presence of a branding and signage construction firm, presenting its installation portfolio and services through an enquiry pipeline routed directly to the team.',
    stack: ['Next.js', 'TypeScript', 'Tailwind', 'PostgreSQL'],
    status: 'Live',
    image: '/images/portfolio/trust-quality-designs.webp',
    imagePosition: 'object-left-top',
    liveUrl: 'https://trustqualitydesign.com',
  },
]

// Only show tabs for categories that actually have projects
const filters: Array<'All' | Category> = ['All', ...Array.from(new Set(projects.map((p) => p.category)))]

const Portfolio = () => {
  const [active, setActive] = useState<'All' | Category>('All')
  const visible = useMemo(
    () => (active === 'All' ? projects : projects.filter((p) => p.category === active)),
    [active],
  )

  return (
    <section id="portfolio" className="pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="section-label">Selected Work</span>
          <h2 className="section-title-main">Evidence, Not Assertion</h2>
          <p className="section-intro">
            Platforms, websites and software in production for enterprises in The Gambia and beyond.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Filter projects">
          {filters.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={active === f}
              onClick={() => setActive(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                active === f
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {visible.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

const ProjectCard = ({ project: p, index }: { project: Project; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.05 }}
    className="group flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 transition-colors hover:border-green-500/40 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
  >
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
      {p.image && p.liveUrl ? (
        <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title} website`} className="block h-full w-full">
          <img
            src={p.image}
            alt={`${p.title} screenshot`}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover ${p.imagePosition ?? 'object-top'} transition-transform duration-500 group-hover:scale-[1.03]`}
          />
        </a>
      ) : p.image ? (
        <img
          src={p.image}
          alt={`${p.title} screenshot`}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${p.imagePosition ?? 'object-top'} transition-transform duration-500 group-hover:scale-[1.03]`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-500/15 via-slate-900 to-slate-950">
          <i className={`fas ${p.icon ?? 'fa-cube'} text-5xl text-green-400/80`}></i>
        </div>
      )}
      <span
        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur ${
          p.status === 'Live' ? 'bg-green-500/90 text-white' : 'bg-black/60 text-white/80'
        }`}
      >
        {p.status === 'Live' && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white align-middle"></span>}
        {p.status}
      </span>
    </div>

    <div className="flex flex-1 flex-col p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-1">{p.category}</div>
      <h3 className="text-xl font-bold text-white leading-snug">{p.title}</h3>
      <div className="text-sm text-white/50 mb-3">{p.client}</div>
      <p className="text-sm text-white/70 leading-relaxed flex-1">{p.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.stack.map((s) => (
          <span key={s} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-white/60">
            {s}
          </span>
        ))}
      </div>

      {p.caseStudy && (
        <Link to={p.caseStudy} className="mt-5 inline-flex items-center text-sm font-semibold text-green-400 hover:text-green-300">
          Read the payment case study <i className="fas fa-arrow-right ml-2 text-xs"></i>
        </Link>
      )}
      {p.liveUrl && (
        <a
          href={p.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center text-sm font-semibold text-green-400 hover:text-green-300"
        >
          Visit {p.liveUrl.replace(/^https?:\/\//, '')} <i className="fas fa-arrow-up-right-from-square ml-2 text-xs"></i>
        </a>
      )}
    </div>
  </motion.article>
)

export default Portfolio
