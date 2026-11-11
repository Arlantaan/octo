import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const partners = [
  { name: 'Koya Restaurant', work: 'Hospitality platform', logo: '/images/partners/koya.webp' },
  { name: 'Ambil Speed', work: 'Web presence & HR systems', logo: '/images/partners/ambil-speed.webp' },
  { name: 'BSIC Gambia', work: 'Banking partner', logo: '/images/partners/bsic.webp' },
  { name: 'Coconut Residence', work: 'Digital menu', logo: '/images/partners/coconut-residence.webp' },
  { name: 'Sensation by Sanu', work: 'Direct-to-consumer commerce', logo: '/images/partners/sensation-by-sanu.webp' },
  { name: 'Trust Quality Designs', work: 'Corporate web presence', logo: '/images/partners/trust-quality-designs.webp', tile: true },
]

const PartnersPage = () => {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Partners"
        description="Organisations that have entrusted OctopusTech with their platforms, digital presence and brand systems, including Koya, Ambil Speed, Sensation by Sanu and Trust Quality Designs."
        path="/partners"
      />

      <div className="max-w-3xl mx-auto text-center">
        <span className="section-label">Partners</span>
        <h1 className="section-title-main">Clients &amp; Partners</h1>
        <p className="section-intro">
          Banking, hospitality, energy, retail and service enterprises that run on platforms and systems engineered by OctopusTech.
        </p>
      </div>

      <div className="mt-12 max-w-6xl mx-auto flex flex-wrap justify-center gap-5">
        {partners.map((p) => (
          <div
            key={p.name}
            className="flex w-full flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-6 transition-colors hover:border-green-500/40 sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Begin an engagement</h2>
        <p className="mt-3 text-white/70">Define the problem; the method will do the rest.</p>
        <Link to="/contact" className="btn-primary-hero rounded-full mt-6">
          Start a Project
        </Link>
      </div>
    </section>
  )
}

export default PartnersPage
