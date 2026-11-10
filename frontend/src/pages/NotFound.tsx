import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-20">
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
      />
      <div className="text-7xl sm:text-8xl font-extrabold text-gradient mb-4">404</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">This page drifted off the map</h1>
      <p className="text-white/70 max-w-md mb-8">
        The page you're looking for doesn't exist or may have moved. Let's get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/" className="btn-primary px-6 py-3 font-semibold">
          Back to Home
        </Link>
        <Link to="/contact" className="btn-secondary px-6 py-3 font-semibold">
          Contact Us
        </Link>
      </div>
    </div>
  )
}

export default NotFound
