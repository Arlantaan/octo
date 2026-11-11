import { Link } from 'react-router-dom'
import { whatsappLink } from '../config/contact'

const links: { name: string; href: string; title?: string }[] = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Partners', href: '/partners' },
  { name: 'AIE / SD', href: '/ai-engineering', title: 'AI Engineering & Software Development' },
  { name: 'AI Lab', href: '/ai-lab' },
  { name: 'Contact', href: '/contact' },
]

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Three columns on one centre line: equal outer columns keep the links truly centred */}
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <img src="/images/octopustech-logo.webp" alt="Octopus Tech" className="h-7 w-auto" />
            <p className="whitespace-nowrap text-sm text-white/50">Raw problems. Refined results.</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm lg:flex-nowrap">
            {links.map((l) => (
              <Link key={l.href} to={l.href} title={l.title} className="whitespace-nowrap text-white/60 transition-colors hover:text-green-400">
                {l.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-4 text-white/60 lg:justify-end">
            <a href="https://www.instagram.com/octopus_tech__/" target="_blank" rel="noopener noreferrer" aria-label="Octopus Tech on Instagram" className="hover:text-green-400 transition-colors">
              <i className="fab fa-instagram text-lg"></i>
            </a>
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="hover:text-green-400 transition-colors">
              <i className="fab fa-whatsapp text-lg"></i>
            </a>
            <a href="mailto:abdulla@octopustech.org" className="hover:text-green-400 transition-colors text-sm">
              abdulla@octopustech.org
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Octopus Tech. All rights reserved.</p>
          <Link to="/privacy" className="hover:text-green-400 transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
