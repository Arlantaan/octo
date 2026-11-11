// API configuration.
// The site and its API are always served from the same origin: in development Vite proxies /api to the
// backend, and in production the web container's Nginx does. A relative path therefore works on
// octopustech.org, www.octopustech.org and any staging host, with no CORS and no hard-coded server.
export const API_BASE_URL = '/api'
