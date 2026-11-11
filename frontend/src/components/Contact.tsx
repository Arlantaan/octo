import { WHATSAPP_DISPLAY, whatsappLink } from '../config/contact'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { ContactFormData } from '../types'
import { API_BASE_URL } from '../config/api'

const Contact = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData & { website?: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const onSubmit = async (data: ContactFormData & { website?: string }) => {
    // Honeypot: bots fill hidden "website" field. Pretend success, send nothing.
    if (data.website) {
      setSubmitStatus('success')
      reset()
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const { website, ...payload } = data
      await axios.post(`${API_BASE_URL}/contact/submit`, payload)
      setSubmitStatus('success')
      reset()
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
      // Error logged for debugging - user sees friendly message
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    { icon: 'fa-envelope', title: 'Email', content: 'abdulla@octopustech.org' },
    { icon: 'fa-whatsapp', title: 'WhatsApp', content: WHATSAPP_DISPLAY },
    { icon: 'fa-clock', title: 'Response Time', content: 'Within 24 hours' },
    { icon: 'fa-globe', title: 'Service Area', content: 'Worldwide' },
  ]

  return (
    <section id="contact" className="contact-section">
      <div className="contact-container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="contact-header"
        >
          <h2 className="section-title-main">Let's Start Your Project</h2>
          <p className="section-intro">
            Discuss how we can transform your digital presence
          </p>
        </motion.div>

      {/* Contact Form */}
      <div className="contact-form-wrapper">
        <div className="contact-form-card">
          <p className="form-intro">
            Fill in the form below and I'll get back to you within 24 hours to talk through your project.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Honeypot — hidden from users, catches bots */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Leave this field empty</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-sm sm:text-base"
                  placeholder="Full Name"
                />
                {errors.name && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  id="company"
                  {...register('company')}
                  className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-sm sm:text-base"
                  placeholder="Company Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-sm sm:text-base"
                  placeholder="Email Address"
                />
                {errors.email && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { required: 'Phone is required' })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-sm sm:text-base"
                  placeholder="Phone Number"
                />
                {errors.phone && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="service" className="block text-sm font-medium mb-2">Service Interest *</label>
              <select
                id="service"
                {...register('service', { required: 'Please select a service' })}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-sm sm:text-base"
              >
                <option value="">Select a service</option>
                <option value="web-development">Web Development</option>
                <option value="software-development">Software Development</option>
                <option value="ai-engineering">AI Engineering</option>
                <option value="payment-integration">Payment Integration</option>
                <option value="consultation">Consultation</option>
                <option value="other">Other</option>
              </select>
              {errors.service && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.service.message}</p>}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">Project Details / Message *</label>
              <textarea
                id="message"
                {...register('message', { required: 'Message is required' })}
                rows={4}
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-sm sm:text-base resize-y"
                placeholder="Project details or message"
              />
              {errors.message && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.message.message}</p>}
            </div>

            {submitStatus === 'success' && (
              <div className="p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm sm:text-base">
                Thank you for your message! We will get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm sm:text-base">
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm sm:text-base"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="contact-info-wrapper"
      >
        <div className="contact-info-grid">
          {contactInfo.map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="contact-info-item"
            >
              <div className="contact-info-icon">
                <i className={`${info.icon === 'fa-whatsapp' ? 'fab' : 'fas'} ${info.icon}`}></i>
              </div>
              <h4 className="contact-info-title">{info.title}</h4>
              {info.title === 'Email' ? (
                <a 
                  href={`mailto:${info.content}?subject=Inquiry from Octopus Tech Website&body=Hello,%0D%0A%0D%0APlease tell us about your project or inquiry:%0D%0A%0D%0A%0D%0A%0D%0AThank you!`}
                  className="contact-info-content hover:text-green-400 transition-colors cursor-pointer"
                >
                  {info.content}
                </a>
              ) : info.title === 'WhatsApp' ? (
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-info-content hover:text-green-400 transition-colors cursor-pointer"
                >
                  {info.content}
                </a>
              ) : (
                <p className="contact-info-content">{info.content}</p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
    </section>
  )
}

export default Contact

