import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import SEO from '../components/SEO'
import Career from '../components/Career'

const VisionMission = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  const pillars = [
    {
      icon: 'fa-globe-africa',
      title: 'Close the Access Gap',
      body: 'Across emerging markets, small enterprises and independent operators remain excluded from high-calibre digital work. OctopusTech exists to correct that asymmetry: agency-grade output, without the agency overhead.',
    },
    {
      icon: 'fa-seedling',
      title: 'Prove the Model',
      body: 'A single practitioner operating across four disciplines, with AI as a force multiplier, is no longer an anomaly; it is an emerging model of production. Each engagement is evidence that rigour, sustained learning and the right instruments can outperform scale.',
    },
    {
      icon: 'fa-layer-group',
      title: 'Build, Then Scale',
      body: 'The long-term objective is not a services firm but a platform: SaaS products, systems and frameworks distilled from the same methodology, so that the next independent builder in any market can operate to the same standard.',
    },
  ]

  return (
    <section className="about-section" style={{ paddingTop: 0 }}>
      <div className="about-container">
        <div className="about-content-centered">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="section-label about-section-label">Vision & Mission</span>
            <h2 className="section-title-main">Purpose</h2>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="glass-effect p-6 sm:p-8 mb-6 max-w-3xl mx-auto text-center"
            style={{ borderLeft: '3px solid #22c55e' }}
          >
            <div className="text-xs uppercase tracking-widest text-green-400 mb-3 font-semibold">Vision</div>
            <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
              A world in which geography, pedigree and budget no longer determine whether an idea reaches its audience.
            </p>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="glass-effect p-6 sm:p-8 mb-10 max-w-3xl mx-auto text-center"
            style={{ borderLeft: '3px solid #22c55e' }}
          >
            <div className="text-xs uppercase tracking-widest text-green-400 mb-3 font-semibold">Mission</div>
            <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
              To deliver research, design, data and software of institutional quality to the businesses and individuals the conventional agency model has priced out.
            </p>
          </motion.div>

          {/* 3 Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">Theory of Growth</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {pillars.map((p, i) => (
                <div key={i} className="glass-effect p-6 text-center">
                  <div className="text-3xl mb-4 text-green-400">
                    <i className={`fas ${p.icon}`}></i>
                  </div>
                  <h4 className="text-white font-bold text-base mb-3">{p.title}</h4>
                  <p className="text-white/70 text-sm leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* The scale roadmap */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-10 max-w-3xl mx-auto"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">The Roadmap</h3>
            <div className="space-y-4">
              {[
                { phase: '01', label: 'Practitioner', desc: 'Four disciplines, deployed independently or embedded within a client organisation, establishing proof through delivered work.' },
                { phase: '02', label: 'Productise', desc: 'Codify recurring solutions into SaaS products, templates and systems, decoupling output from hours.' },
                { phase: '03', label: 'Enable', desc: 'Make the methodology transferable, through tools and frameworks with which others can reproduce it.' },
                { phase: '04', label: 'Platform', desc: 'OctopusTech as infrastructure: not only what is delivered, but what others build upon.' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4 glass-effect p-4">
                  <div className="text-green-400 font-extrabold text-xl min-w-[36px]">{step.phase}</div>
                  <div>
                    <div className="text-white font-bold text-sm mb-1">{step.label}</div>
                    <div className="text-white/70 text-sm leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

const AboutPage = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <>
    <SEO
      title="About"
      description="Abdulla Alami, developer and designer working across research, design, data and software, applying a first-principles Five Ws method to every engagement."
    />
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-content-centered">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <figure className="about-portrait">
              <div className="about-portrait-ring">
                <img src="/images/abdulla.webp" alt="Abdulla Alami, founder of OctopusTech" width={840} height={840} />
              </div>
              <figcaption>
                <span className="about-portrait-name">Abdulla Alami</span>
                <span className="about-portrait-role">Founder · Developer & Designer</span>
              </figcaption>
            </figure>
            <span className="section-label about-section-label">About OctopusTech</span>
            <h2 className="section-title-main">Many Arms. One Humble Octopus.</h2>
            <p className="section-intro">
              A developer and designer whose practice rests on first-principles inquiry: nothing is built until the problem is understood in full. Like the octopus, the work is quiet, adaptive and distributed, every arm engaged at once.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 text-white text-center">Trajectory</h3>
            <p className="text-white/80 mb-5 sm:mb-6 leading-relaxed text-base sm:text-lg text-center max-w-3xl mx-auto">
              The practice began in visual design. Illustrator and Photoshop instilled a discipline of precision: every element must justify its place. That discipline extended into software engineering, and from there into data analysis, where evidence replaces intuition as the basis for decisions.
            </p>
            <p className="text-white/80 mb-5 sm:mb-6 leading-relaxed text-base sm:text-lg text-center max-w-3xl mx-auto">
              The technical work rests on a foundation in Diplomacy and International Relations from the Civil Service University. It governs how stakeholders are heard, how questions are framed, and how each project is situated within the larger system it serves.
            </p>
            <p className="text-white/80 mb-6 sm:mb-8 leading-relaxed text-base sm:text-lg text-center max-w-3xl mx-auto">
              The method is self-directed and deliberately continuous, advancing at the pace of the technology itself. Formal education laid the foundations on which much of today's progress rests; independent study extends them. The principle is constant: raw problems in, refined results out.
            </p>
          </motion.div>

          {/* The 5 Ws */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 sm:mt-16"
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-white text-center">Method: The Five Ws</h3>
            <p className="text-white/70 mb-8 leading-relaxed text-base text-center max-w-2xl mx-auto">
              No design, build or analysis begins until the problem has been examined along five axes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {[
                { w: 'Who', q: 'Who is served, and who bears the cost of the problem?' },
                { w: 'What', q: 'What precisely is failing, and by what measure will success be judged?' },
                { w: 'When', q: 'When does it manifest, and what does the timeline demand?' },
                { w: 'Where', q: 'Where does it surface: in the interface, in the data, or in operations on the ground?' },
                { w: 'Why', q: 'Why does it persist? Isolate the root cause, never merely the symptom.' },
              ].map((item) => (
                <div key={item.w} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-left">
                  <div className="text-green-400 font-extrabold text-xl mb-2">{item.w}?</div>
                  <p className="text-white/70 text-sm leading-relaxed">{item.q}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
    <Career />
    <VisionMission />
    </>
  )
}

export default AboutPage

