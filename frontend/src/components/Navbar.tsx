import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import MenuBloom from './MenuBloom'

// Golden ratio constants: every size, delay and duration in the mobile menu derives from φ.
const PHI = 1.618
const T_OPEN = 1 / PHI // 0.618s
const T_CLOSE = 1 / PHI ** 2 // 0.382s
const STAGGER = 0.0618 // 61.8ms between links
const EASE_PHI: [number, number, number, number] = [0.382, 0, 0.236, 1]
const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5)) // 137.5°

/**
 * Hamburger drawn as three tentacles (right-aligned, lengths 1 : 1/φ : 1/φ²).
 * Idle: each bar ripples in a slow wave, offset by 0.382s. Open: the outer bars curl
 * into a curved X like two crossing tentacles, the middle one retracts, and the icon spins.
 */
const bar = (x0: number, y: number, wave: number) =>
  `M ${x0} ${y} C ${x0 + (26 - x0) * 0.382} ${y - wave}, ${x0 + (26 - x0) * 0.618} ${y + wave}, 26 ${y}`
const BARS = [
  { x0: 2, y: 2 },
  { x0: 26 - 24 / PHI, y: 9 },
  { x0: 26 - 24 / PHI ** 2, y: 16 },
]
const OPEN_PATHS = [
  'M 5 2 C 12 3.5, 14 14.5, 23 16', // tentacle curving down
  'M 14 9 C 14 9, 14 9, 14 9', // middle retracts to a point
  'M 5 16 C 12 14.5, 14 3.5, 23 2', // tentacle curving up
]

const TentacleIcon = ({ open }: { open: boolean }) => {
  const reduce = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 28 18"
      width="28"
      height="18"
      aria-hidden="true"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: T_OPEN, ease: EASE_PHI }}
      style={{ overflow: 'visible' }}
    >
      {BARS.map((b, i) => (
        <motion.path
          key={i}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          initial={false}
          animate={
            open
              ? { d: OPEN_PATHS[i], stroke: '#4ade80', opacity: i === 1 ? 0 : 1 }
              : reduce
                ? { d: bar(b.x0, b.y, 0), stroke: '#ffffff', opacity: 1 }
                : {
                    // slow tentacle ripple: straight → wave → straight → counter-wave
                    d: [bar(b.x0, b.y, 0), bar(b.x0, b.y, 1.8), bar(b.x0, b.y, 0), bar(b.x0, b.y, -1.8), bar(b.x0, b.y, 0)],
                    stroke: '#ffffff',
                    opacity: 1,
                  }
          }
          transition={
            open
              ? { duration: T_OPEN, ease: EASE_PHI, delay: i * STAGGER }
              : {
                  d: { duration: 3.236, ease: 'easeInOut', repeat: Infinity, delay: i * 0.382 },
                  stroke: { duration: T_CLOSE },
                  opacity: { duration: T_CLOSE },
                }
          }
        />
      ))}
    </motion.svg>
  )
}

const navLinks: { name: string; href: string; sub?: string }[] = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Partners', href: '/partners' },
  { name: 'AIE / SD', href: '/ai-engineering', },
  { name: 'Contact', href: '/contact' },
]

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const burgerRef = useRef<HTMLButtonElement>(null)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })

  // The bloom bursts out of the button itself, so measure it at the moment of opening
  const toggle = useCallback(() => {
    const r = burgerRef.current?.getBoundingClientRect()
    if (r) setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    setIsOpen((o) => !o)
  }, [])

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
                  title={link.sub}
                  className={`nav-link font-medium text-sm lg:text-base ${link.sub ? 'has-sub' : ''} ${location.pathname === link.href ? 'active' : ''}`}
                >
                  {link.name}
                  {link.sub && <span className="nav-sub">{link.sub}</span>}
                </Link>
              ))}
              <Link to="/quote" className="btn-primary">
                Get Quote
              </Link>
            </div>

            {/* Golden-ratio hamburger: living tentacle bars that curl into a curved X */}
            <button
              ref={burgerRef}
              onClick={toggle}
              className={`phi-burger md:hidden ${isOpen ? 'is-open' : ''}`}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <TentacleIcon open={isOpen} />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: T_CLOSE, ease: EASE_PHI } }}
            exit={{ opacity: 0, transition: { duration: T_CLOSE, ease: EASE_PHI, delay: STAGGER * 2 } }}
          >
            <MenuBloom originX={origin.x} originY={origin.y} />
            <nav aria-label="Mobile" className="phi-menu-inner">
              <ol className="phi-menu-list">
                {navLinks.map((link, i) => {
                  const active = location.pathname === link.href
                  // Each link launches from its own point on the golden spiral and sweeps into place
                  const angle = i * GOLDEN_ANGLE_RAD + Math.PI * 0.618
                  const dist = 161.8 * Math.pow(PHI, i / 4)
                  return (
                    <motion.li
                      key={link.href}
                      initial={{
                        opacity: 0,
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist * 0.618,
                        rotate: ((angle * 180) / Math.PI) % 360 > 180 ? -13 : 13,
                        scale: 0.618,
                        filter: 'blur(8px)',
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotate: 0,
                        scale: 1,
                        filter: 'blur(0px)',
                        transition: { duration: T_OPEN * PHI, ease: EASE_PHI, delay: T_CLOSE + i * STAGGER },
                      }}
                      exit={{
                        opacity: 0,
                        x: -Math.cos(angle) * 34,
                        scale: 0.854,
                        filter: 'blur(4px)',
                        transition: { duration: T_CLOSE / PHI, ease: EASE_PHI, delay: (navLinks.length - i) * STAGGER * 0.382 },
                      }}
                    >
                      <Link to={link.href} className={`phi-menu-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                        <span className="phi-menu-index">{String(i + 1).padStart(2, '0')}</span>
                        <span>
                          {link.name}
                          {link.sub && <span className="phi-menu-sub">{link.sub}</span>}
                        </span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ol>

              <motion.div
                className="phi-menu-foot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: T_OPEN, delay: T_OPEN + navLinks.length * STAGGER } }}
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
