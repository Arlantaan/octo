import Contact from '../components/Contact'
import SEO from '../components/SEO'

const ContactPage = () => {
  return (
    <div>
      <SEO
        title="Contact"
        description="Get in touch with Octopus Tech to discuss your project. We respond within 24 hours."
      />
      <Contact />
    </div>
  )
}

export default ContactPage

