import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../config/api'

interface Message {
  id: number
  name: string
  email: string
  company: string | null
  phone: string
  service: string
  message: string
  created_at: string
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, { password })
      if (response.data.status === 'success') {
        localStorage.setItem('admin_password', password)
        setIsAuthenticated(true)
        fetchMessages()
      }
    } catch (error: any) {
      setError('Invalid password!')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const storedPassword = localStorage.getItem('admin_password') || password
      const response = await axios.get(`${API_BASE_URL}/admin/messages?password=${storedPassword}`)
      setMessages(response.data)
    } catch (error: any) {
      if (error.response?.status === 401) {
        setIsAuthenticated(false)
        localStorage.removeItem('admin_password')
        setError('Session expired. Please login again.')
      } else {
        console.error('Error fetching messages:', error)
        setError('Failed to load messages')
      }
    }
  }

  useEffect(() => {
    const storedPassword = localStorage.getItem('admin_password')
    if (storedPassword) {
      setPassword(storedPassword)
      setIsAuthenticated(true)
      fetchMessages()
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin_password')
    setIsAuthenticated(false)
    setPassword('')
    setMessages([])
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <div className="glass-effect p-8 rounded-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/20 rounded-lg focus:border-green-400 focus:outline-none text-white placeholder-white/50"
              required
            />
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 text-white"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contact Messages</h1>
            <p className="text-white/70">Total: {messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 rounded-lg hover:opacity-90 transition-opacity text-white font-medium"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="glass-effect p-8 text-center">
              <p className="text-white/70 text-lg">No messages yet.</p>
              <p className="text-white/50 text-sm mt-2">Contact form submissions will appear here.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="glass-effect p-6 rounded-lg hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{msg.name}</h3>
                    <a 
                      href={`mailto:${msg.email}`}
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      {msg.email}
                    </a>
                  </div>
                  <span className="text-sm text-white/50">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-white/70">Phone:</span>
                    <a href={`tel:${msg.phone}`} className="text-white ml-2 hover:text-green-400 transition-colors">
                      {msg.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-white/70">Service:</span>
                    <span className="text-white ml-2">{msg.service}</span>
                  </div>
                  {msg.company && (
                    <div>
                      <span className="text-white/70">Company:</span>
                      <span className="text-white ml-2">{msg.company}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-white/90 leading-relaxed">{msg.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin

