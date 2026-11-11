import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const Hero = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <header className="hero-section">
      <div className="hero-content">
        {/* Main Headline */}
        <motion.h1
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="hero-headline text-4xl sm:text-6xl md:text-7xl font-extrabold text-center tracking-tight"
          style={{ maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' }}
        >
          Raw Problems. <span className="hero-headline-accent">Refined Results.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hero-subheadline text-base sm:text-lg md:text-xl text-center text-white/75"
          style={{ maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}
        >
          Web, software, AI and payments, unified under one method: every problem interrogated at its root and carried from first principle to production.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="hero-cta flex justify-center mt-6"
        >
          <a
            href="/contact"
            className="btn-primary-hero rounded-full"
          >
            Start Your Project
          </a>
        </motion.div>

        {/* Discipline pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-10"
        >
          {['Web Development', 'Software Development', 'AI Engineering', 'Payment Integration'].map((label) => (
            <span
              key={label}
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-white/80 bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Removed stats section for more writing space */}
    </header>
  )
}

export default Hero

