import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const partners = [
  { name: 'Koya Restaurant', work: 'Website, menu & ordering', logo: '/images/partners/koya.webp' },
  { name: 'Ambil Speed', work: 'Website & HR system', logo: '/images/partners/ambil-speed.webp' },
  { name: 'BSIC Gambia', work: 'Branding & signage', logo: '/images/partners/bsic.webp' },
  { name: 'Coconut Residence', work: 'Digital menu', logo: '/images/partners/coconut-residence.webp' },
  { name: 'Sensation by Sanu', work: 'E-commerce store', logo: '/images/partners/sensation-by-sanu.webp' },
  { name: 'Trust Quality Designs', work: 'Company website', logo: '/images/partners/trust-quality-designs.webp', tile: true },
  { name: 'Golden Horizon Logistics', work: 'Company website', logo: '/images/partners/golden-horizon.webp' },
]

const PartnersPage = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Partners"
        description="Businesses OctopusTech has designed and built for: Koya, Ambil Speed, BSIC Gambia, Trust Quality Designs and more."
        path="/partners"
      />

      <div className="max-w-3xl mx-auto text-center">
        <span className="section-label">Partners</span>
        <h1 className="section-title-main">Brands I've worked with</h1>
        <p className="section-intro">
          Restaurants, retailers, banks and service companies that trusted OctopusTech with their websites, platforms and brand work.
        </p>
      </div>

      <div className="mt-12 max-w-6xl mx-auto grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((p) => (
          <div
            key={p.name}
            className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition-colors hover:border-green-500/40"
          >
            <div className="flex h-28 items-center justify-center">
              <img
                src={p.logo}
                alt={`${p.name} logo`}
                loading="lazy"
                className={p.tile ? 'h-24 w-auto rounded-xl' : 'max-h-20 max-w-[85%] w-auto object-contain'}
              />
            </div>
            <div className="mt-5 border-t border-white/10 pt-4 text-center">
              <div className="font-semibold text-white">{p.name}</div>
              <div className="text-sm text-white/55">{p.work}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-3xl mx-auto text-center rounded-2xl border border-white/10 bg-slate-900/60 p-8 sm:p-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Want your brand here next?</h2>
        <p className="mt-3 text-white/70">Tell me about the problem you're trying to solve and I'll show you how we can fix it.</p>
        <Link to="/contact" className="btn-primary-hero rounded-full mt-6">
          Start Your Project
        </Link>
      </div>
    </section>
  )
}

export default PartnersPage
