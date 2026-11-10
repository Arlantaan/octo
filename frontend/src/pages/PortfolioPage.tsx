import Portfolio from '../components/Portfolio'
import SEO from '../components/SEO'

const PortfolioPage = () => {
  return (
    <div className="pt-24 sm:pt-28">
      <SEO
        title="Portfolio"
        description="Real work, real clients. E-commerce launches, SaaS platforms, brand systems, and automation — built, shipped, and working."
      />
      <Portfolio />
    </div>
  )
}

export default PortfolioPage
