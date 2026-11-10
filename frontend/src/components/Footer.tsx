import { Link } from 'react-router-dom'

const links = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Partners', href: '/partners' },
  { name: 'AI Lab', href: '/ai-lab' },
  { name: 'Contact', href: '/contact' },
]

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <img src="/images/octopustech-logo.webp" alt="Octopus Tech" className="h-7 w-auto" />
            <p className="text-white/50 text-sm">Raw problems. Refined results.</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {links.map((l) => (
              <Link key={l.href} to={l.href} className="text-white/60 hover:text-green-400 transition-colors">
                {l.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-center gap-4 text-white/60">
            <a href="https://www.instagram.com/octopus_tech__/" target="_blank" rel="noopener noreferrer" aria-label="Octopus Tech on Instagram" className="hover:text-green-400 transition-colors">
              <i className="fab fa-instagram text-lg"></i>
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
