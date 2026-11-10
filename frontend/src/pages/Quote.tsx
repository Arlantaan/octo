
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API_BASE_URL } from '../config/api'
import SEO from '../components/SEO'

const Quote = () => {
  // A project brief can arrive from the AI Lab's 5 Ws Scoper
  const location = useLocation()
  const fromScoper = (location.state as { project?: string } | null)?.project ?? ''
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    project: fromScoper,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch(`${API_BASE_URL}/contact/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.project,
          service: 'Quote Request',
          company: '',
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ name: '', email: '', phone: '', project: '' })
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to submit. Please try again.')
      }
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <SEO
        title="Request a Quote"
        description="Describe your project and get a fair, transparent quote — agency quality without agency pricing."
      />
      <div className="container mx-auto px-4 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Request a Quote</h1>
          <p className="text-xl text-white/70 mb-4">Describe your project and I'll get back to you with a quote.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <div className="glass-effect px-4 py-3 text-sm text-white/80 text-center">
              <span className="text-green-400 font-bold block text-base">Agency quality</span>
              London agencies charge £3,000+ for a logo
            </div>
            <div className="glass-effect px-4 py-3 text-sm text-white/80 text-center">
              <span className="text-green-400 font-bold block text-base">Not agency pricing</span>
              You don't pay for their office, their team, their overhead
            </div>
            <div className="glass-effect px-4 py-3 text-sm text-white/80 text-center">
              <span className="text-green-400 font-bold block text-base">Not Fiverr either</span>
              This is real work, priced fairly for real markets
            </div>
          </div>
        </motion.div>
        <form className="glass-effect p-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="quote-name" className="block mb-2 font-semibold">Name</label>
            <input
              id="quote-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-green-400 outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="quote-email" className="block mb-2 font-semibold">Email</label>
            <input
              id="quote-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-green-400 outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="quote-phone" className="block mb-2 font-semibold">Phone</label>
            <input
              id="quote-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-green-400 outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="quote-project" className="block mb-2 font-semibold">Project Details</label>
            <textarea
              id="quote-project"
              name="project"
              value={form.project}
              onChange={handleChange}
              className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-green-400 outline-none min-h-[120px]"
              required
              placeholder="Describe your project, goals, and any specific requirements..."
            />
          </div>
          {error && <div className="text-red-400 text-center">{error}</div>}
          {success && <div className="text-green-400 text-center font-semibold">Thank you! We’ll contact you soon.</div>}
          <button
            type="submit"
            className="btn-primary w-full py-3 text-lg font-bold"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Request Quote'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Quote

