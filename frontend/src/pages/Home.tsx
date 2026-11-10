
import Hero from '../components/Hero'
import SEO from '../components/SEO'

const Home = () => {
  return (
    <div>
      <SEO
        title="Raw Problems. Refined Results."
        description="AI research, graphic design, data analysis, and web & SaaS development — self-taught, AI-powered, fully delivered. Agency quality, without agency pricing."
        path="/"
      />
      <Hero />
    </div>
  )
}

export default Home

