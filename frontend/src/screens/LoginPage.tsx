import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!userId) { setError('User ID is required'); return }
    if (!password) { setError('Password is required'); return }

    // Role detection and attempt order
    const looksChairman = /^chairman$/i.test(userId)
    // For any non-chairman input, always try student first then coordinator
    const rolesToTry: Array<'student' | 'coordinator' | 'chairman'> = looksChairman
      ? ['chairman']
      : ['student', 'coordinator']

    try {
      setLoading(true)
      const envBase = (import.meta as any).env?.VITE_API_URL
      const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
      const base = envBase || (isVercel ? 'https://summar-it.vercel.app' : 'http://localhost:3000')
      const apiUrl = `${base}/api/login`
      const bodyFor = (r: 'student' | 'coordinator' | 'chairman') => (
        r === 'student' ? { role: r, studentId: userId, password } :
        r === 'coordinator' ? { role: r, coordinatorId: Number(userId), password } :
        { role: r }
      )
      // Helper to extract a clean error message
      const extractError = async (resp: Response) => {
        const text = await resp.text().catch(() => '')
        try {
          const json = JSON.parse(text)
          return json.error || json.message || json.details || 'Login failed'
        } catch {
          return text || 'Login failed'
        }
      }

      let lastErr = ''
      for (const role of rolesToTry) {
        const body = bodyFor(role)
        const resp = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!resp.ok) {
          lastErr = await extractError(resp)
          continue
        }
        const data = await resp.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.role)
        if (data.userName) localStorage.setItem('userName', data.userName)
        if (role === 'student') {
          localStorage.setItem('studentId', userId)
          if (data.section) localStorage.setItem('section', data.section)
          navigate('/student')
        } else if (role === 'coordinator') {
          localStorage.setItem('coordinatorId', String(userId))
          if (Array.isArray(data.sections)) localStorage.setItem('sections', JSON.stringify(data.sections))
          navigate('/coordinator')
        } else {
          navigate('/chairman')
        }
        return
      }
      throw new Error(lastErr || 'Login failed')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-white py-4">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 480 }}>
        <div className="card-body">
          <h2 className="card-title mb-3" style={{ color: '#111827' }}>Welcome</h2>
          <form onSubmit={handleLogin} className="d-grid gap-2">
            {error && (
              <div className="alert alert-danger py-2 mb-2" role="alert">{error}</div>
            )}
            <input
              className="form-control"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
            />
            <input
              className="form-control"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="btn btn-primary mt-1 w-100">
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
