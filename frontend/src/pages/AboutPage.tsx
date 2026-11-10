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
      body: 'Most of the world — small businesses, solo operators, communities in emerging markets — has been priced out of quality digital work. OctopusTech exists to change that. Agency-level output at a price that doesn\'t require a corporate budget.',
    },
    {
      icon: 'fa-seedling',
      title: 'Prove the Model',
      body: 'A self-taught technologist running four disciplines with AI as the engine is no longer a novelty — it\'s a blueprint. Every project OctopusTech delivers is proof that curiosity, continuous learning and the right tools can open doors for anyone willing to put in the work.',
    },
    {
      icon: 'fa-layer-group',
      title: 'Build, Then Scale',
      body: 'The long-term vision is not a service business. It\'s a platform — SaaS tools, systems, and frameworks built from the same refinery stack — that let the next self-taught person in any market run their own version of this. The model should be replicable, not just the output.',
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
            <h2 className="section-title-main">Why This Exists</h2>
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
              A world where your location, your background, and your budget are no longer the deciding factors in whether your idea reaches the world.
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
              To deliver AI Research, Graphic Design, Data Analysis, and Web & SaaS Development — at a standard and price that puts it within reach of businesses and individuals that the traditional agency model left behind.
            </p>
          </motion.div>

          {/* 3 Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-6">How It Grows</h3>
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
                { phase: '01', label: 'Hands-on Builder', desc: 'Four arms, working alone or alongside a client’s team. Proof of concept: delivering real work across real disciplines.' },
                { phase: '02', label: 'Productise', desc: 'Package the services into SaaS tools, templates, and systems. Move from time-for-money to scalable output.' },
                { phase: '03', label: 'Enable Others', desc: 'Make the refinery model accessible. Build tools and frameworks that let the next self-taught person run their own version of this.' },
                { phase: '04', label: 'Platform', desc: 'OctopusTech as infrastructure — not just what I deliver, but what others use to deliver theirs.' },
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
      description="A self-taught developer and designer: graphic design, web & software development and data analysis, solving problems by understanding the 5 Ws."
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
              A self-taught developer and designer who's curious by nature, thinks outside the box, and always digs deeper to understand a problem before solving it. Like an octopus: quiet, adaptable, every arm working at once. Equally at home on my own or inside your team.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 text-white text-center">My Story</h3>
            <p className="text-white/80 mb-5 sm:mb-6 leading-relaxed text-base sm:text-lg text-center max-w-3xl mx-auto">
              It started with graphic design. Illustrator and Photoshop taught me how to look at a problem visually and make every detail count. That curiosity pulled me into web development and software, and from there into data analytics tools, using data to see clearly and make smarter moves.
            </p>
            <p className="text-white/80 mb-5 sm:mb-6 leading-relaxed text-base sm:text-lg text-center max-w-3xl mx-auto">
              Alongside the tech, I studied Diplomacy and International Relations at the Civil Service University. That training shaped how I listen, how I ask questions, and how I see the bigger picture behind every project.
            </p>
            <p className="text-white/80 mb-6 sm:mb-8 leading-relaxed text-base sm:text-lg text-center max-w-3xl mx-auto">
              Technology never stands still, and neither do I. I'm still learning every day. Formal education has shaped many of the brilliant minds we learn from today; my path simply added self-teaching on top of it. You bring the raw problem, and I refine it into a result.
            </p>
          </motion.div>

          {/* The 5 Ws */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 sm:mt-16"
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-white text-center">How I Solve Problems: The 5 Ws</h3>
            <p className="text-white/70 mb-8 leading-relaxed text-base text-center max-w-2xl mx-auto">
              Before I design, build or analyse anything, I make sure I understand the problem from every angle.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {[
                { w: 'Who', q: 'Who is this for, and who does the problem affect?' },
                { w: 'What', q: 'What exactly is the problem, and what does success look like?' },
                { w: 'When', q: 'When does it happen, and when does it need to be solved?' },
                { w: 'Where', q: 'Where does it show up: online, in the data, or on the ground?' },
                { w: 'Why', q: 'Why does it exist? Find the root cause, not just the symptom.' },
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

