import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GoldenField from './components/GoldenField'
import AskOcto from './ai/AskOcto'
import AILab from './pages/AILab'
import AIEngineering from './pages/AIEngineering'
import CaseStudyEtikz from './pages/CaseStudyEtikz'
import Home from './pages/Home'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import PortfolioPage from './pages/PortfolioPage'
import ContactPage from './pages/ContactPage'
import PartnersPage from './pages/PartnersPage'
import Quote from './pages/Quote'
import Admin from './pages/Admin'
import PrivacyPolicy from './pages/PrivacyPolicy'
import NotFound from './pages/NotFound'

// Layout component for pages with Navbar/Footer
function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      {/* Inner pages are text-heavy: dim the shared background image so copy stays readable */}
      {pathname !== '/' && <div className="page-bg-dim" aria-hidden="true" />}
      {/* Golden-ratio animation sits above the dim layer (it has its own text-safe fade) */}
      <GoldenField />
      <Navbar />
      <main className="flex-grow pt-14 sm:pt-16 md:pt-20 site-main">
        <Outlet />
      </main>
      <Footer />
      <AskOcto />
    </div>
  )
}

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Admin route - standalone, no Navbar/Footer */}
          <Route path="/admin" element={<Admin />} />
          
          {/* All other routes - with Navbar/Footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/ai-lab" element={<AILab />} />
            <Route path="/ai-engineering" element={<AIEngineering />} />
            <Route path="/work/etikz" element={<CaseStudyEtikz />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
