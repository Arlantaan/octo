import { motion } from 'framer-motion'

// Professional career, written as a CV. Most recent role first.
const roles = [
  {
    company: 'Wave Mobile Money',
    role: 'Account Supervisor',
    period: 'Current',
    summary:
      'Solving day-to-day problems for businesses and government institutions on one of Africa’s fastest-growing mobile money networks, and training their teams to use technology to fix everyday problems themselves.',
    points: [],
  },
  {
    company: 'Wave Mobile Money',
    role: 'Deployment Officer, Payments',
    period: 'Previously',
    summary: 'Joined the payments team, rolling Wave out to merchants.',
    points: ['Helped grow the merchant network to a billion dalasis in transaction volume'],
  },
  {
    company: 'Sourcertz Technology Limited',
    role: 'Digital Projects Manager',
    period: 'From 2022',
    summary:
      'Managed digital projects for fintech and energy clients, working with banks, telecoms and fintech partners.',
    points: [
      'Supported the development of PlugDrive, an EV charging platform',
      'Managed forecourt fuel management software for global stakeholders',
      'Contributed to API design and system integrations',
      'Helped ensure compliance with KYC, AML and Central Bank of Ghana regulations',
      'Supported security protocols, fraud prevention and system performance monitoring',
    ],
  },
  {
    company: 'Access Bank',
    role: 'Digital Projects Manager',
    period: '2021 – 2022',
    summary: 'Managed digital banking and fintech projects.',
    points: [
      'Managed the Instant Visa Card Issuance project',
      'Oversaw the SMS Alerts service for real-time transaction notifications',
      'Worked with Interswitch to manage ATMs and optimise Postilion transaction processing',
    ],
  },
]

const education = [
  { year: '2024', title: 'Google Cybersecurity Certificate', place: 'Coursera' },
  { year: '2020 – 2021', title: 'Postgraduate Diploma in International Relations', place: 'Banjul Institute of Professional Studies' },
  { year: '2020 – 2021', title: 'Graduate Diploma in International Relations', place: 'Banjul Institute of Professional Studies' },
  { year: '2020 – 2021', title: 'Advanced Diploma in International Relations & Diplomacy', place: 'MDI' },
  { year: '2019 – 2020', title: 'Diploma in International Relations & Diplomacy', place: 'MDI' },
]

const skills = [
  { group: 'Build', items: ['Python', 'Java', 'HTML & CSS', 'SQL', 'API development', 'Bash for Linux'] },
  { group: 'Data', items: ['Data analysis', 'Python Pandas', 'Power BI', 'Automating tasks'] },
  { group: 'Design', items: ['Illustrator', 'Photoshop', 'After Effects', 'InDesign', 'Figma'] },
  { group: 'Deliver', items: ['Project management', 'Microsoft 365', 'Team training', 'Stakeholder management'] },
]

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-61.8px' },
  transition: { duration: 0.618, ease: [0.382, 0, 0.236, 1] as [number, number, number, number] },
}

const Career = () => (
  <section className="career-section" aria-labelledby="career-title">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <motion.div {...fade} className="text-center max-w-2xl mx-auto">
        <span className="section-label">Career</span>
        <h2 id="career-title" className="section-title-main">Experience</h2>
        <p className="section-intro">
          Still young and still building, in my career and in business. Here's where I've learned to solve real problems
          for banks, fintechs, businesses and government.
        </p>
      </motion.div>

      <ol className="career-timeline">
        {roles.map((r) => (
          <motion.li key={r.company + r.role} {...fade} className="career-item">
            <span className="career-dot" aria-hidden="true" />
            <div className="career-card">
              <div className="career-head">
                <div>
                  <h3 className="career-role">{r.role}</h3>
                  <div className="career-company">{r.company}</div>
                </div>
                <span className="career-period">{r.period}</span>
              </div>
              <p className="career-summary">{r.summary}</p>
              {r.points.length > 0 && (
                <ul className="career-points">
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </motion.li>
        ))}
      </ol>

      <div className="career-columns">
        <motion.div {...fade} className="career-card">
          <h3 className="career-subtitle">Education & Certificates</h3>
          <ul className="career-edu">
            {education.map((e) => (
              <li key={e.title}>
                <span className="career-edu-year">{e.year}</span>
                <span>
                  <span className="career-edu-title">{e.title}</span>
                  <span className="career-edu-place">{e.place}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...fade} className="career-card">
          <h3 className="career-subtitle">Skills</h3>
          <div className="career-skills">
            {skills.map((s) => (
              <div key={s.group}>
                <div className="career-skill-group">{s.group}</div>
                <div className="career-chips">
                  {s.items.map((i) => (
                    <span key={i} className="career-chip">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
)

export default Career
