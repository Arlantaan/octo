// API Configuration
const getApiUrl = (): string => {
  // Check if we're in production (not localhost)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1'
  
  if (isProduction) {
    // Check if we're on the production domain
    if (hostname === 'octopustech.org' || hostname === 'www.octopustech.org') {
      return 'https://octopustech.org/api'
    }
    // Fallback to IP if domain not ready
    return 'http://91.99.78.37/api'
  }
  // In development, use proxy (localhost:8000)
  return '/api'
}

export const API_BASE_URL = getApiUrl()

