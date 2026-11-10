import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Golden ratio constants: every size, delay and duration in the mobile menu derives from φ.
const PHI = 1.618
const T_OPEN = 1 / PHI // 0.618s
const T_CLOSE = 1 / PHI ** 2 // 0.382s
const STAGGER = 0.0618 // 61.8ms between links
const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Partners', href: '/partners' },
  { name: 'AI Lab', href: '/ai-lab' },
  { name: 'Contact', href: '/contact' },
]

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Close the menu whenever the route changes
  useEffect(() => setIsOpen(false), [location.pathname])

  // Lock page scroll and allow Escape to close while the menu is open
  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  return (
    <>
      <nav className="navbar fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            <Link to="/" className="flex items-center navbar-brand">
              <img src="/images/octopustech-logo.webp" alt="Octopus Tech" className="navbar-logo h-6 sm:h-7 md:h-8 w-auto" />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 navbar-nav">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  aria-current={location.pathname === link.href ? 'page' : undefined}
                  className={`nav-link font-medium text-sm lg:text-base ${location.pathname === link.href ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/quote" className="btn-primary px-4 lg:px-6 py-2 text-sm lg:text-base">
                Get Quote
              </Link>
            </div>

            {/* Golden-ratio hamburger */}
            <button
              onClick={() => setIsOpen((o) => !o)}
              className={`phi-burger md:hidden ${isOpen ? 'is-open' : ''}`}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span className="phi-burger-box" aria-hidden="true">
                <span className="phi-bar phi-bar-1" />
                <span className="phi-bar phi-bar-2" />
                <span className="phi-bar phi-bar-3" />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu: rendered outside the navbar so its blur doesn't trap the fixed overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            className="phi-menu md:hidden"
            initial={{ clipPath: 'circle(0% at 91% 3.4%)' }}
            animate={{ clipPath: 'circle(161.8% at 91% 3.4%)', transition: { duration: T_OPEN, ease: EASE_PHI } }}
            exit={{ clipPath: 'circle(0% at 91% 3.4%)', transition: { duration: T_CLOSE, ease: EASE_PHI, delay: STAGGER } }}
          >
            <nav aria-label="Mobile" className="phi-menu-inner">
              <ol className="phi-menu-list">
                {navLinks.map((link, i) => {
                  const active = location.pathname === link.href
                  return (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: T_CLOSE, ease: EASE_PHI, delay: T_CLOSE * 0.618 + i * STAGGER } }}
                      exit={{ opacity: 0, y: -10, transition: { duration: T_CLOSE / PHI, ease: EASE_PHI } }}
                    >
                      <Link to={link.href} className={`phi-menu-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                        <span className="phi-menu-index">{String(i + 1).padStart(2, '0')}</span>
                        <span>{link.name}</span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ol>

              <motion.div
                className="phi-menu-foot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: T_OPEN, delay: T_CLOSE + navLinks.length * STAGGER } }}
                exit={{ opacity: 0, transition: { duration: T_CLOSE / PHI } }}
              >
                <Link to="/quote" className="btn-primary-hero rounded-full w-full text-center">
                  Get a Quote
                </Link>
                <a href="mailto:abdulla@octopustech.org" className="phi-menu-mail">abdulla@octopustech.org</a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
