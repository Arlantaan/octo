import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const About = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="about" className="about-section">
      <div className="section-divider"></div>
      <div className="about-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="about-header"
        >
          <span className="section-label">About OctopusTech</span>
          <h2 className="section-title-main">One Operator. Every Arm Moving.</h2>
          <p className="section-intro">
            A self-taught developer and designer who's curious by nature and always digs deeper to solve the real problem.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="about-mission-wrapper"
        >
          <h3 className="about-mission-title">The Refinery Model</h3>
          <div className="about-mission-text-container">
            <p className="about-mission-text">
              Crude oil is useless until it's refined. The same goes for information. When AI arrived in full effect, it didn't just speed things up — it unlocked access to knowledge that previously required years of structured education, expensive courses, or connections you didn't have.
            </p>
            <p className="about-mission-text">
              OctopusTech is built on that principle. AI Research, Graphic Design, Data Analysis, Web &amp; SaaS Development — four arms, all self-taught, all running at once. You bring the raw problem. I refine it into a result.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
