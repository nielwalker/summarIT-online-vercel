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

    // Determine role by simple heuristic:
    // - All-digit => treat as coordinator (password must equal ID per current rules)
    // - Contains dash or starts with year => student (password must equal ID)
    // - Otherwise => chairman (password can be any string; UI previously had no password)
    const looksNumeric = /^\d+$/.test(userId)
    const looksStudent = /\d{4}-/.test(userId) || /student/i.test(userId)
    const role: 'student' | 'coordinator' | 'chairman' = looksNumeric && !looksStudent ? 'coordinator' : (looksStudent ? 'student' : 'chairman')

    try {
      setLoading(true)
      const envBase = (import.meta as any).env?.VITE_API_URL
      const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
      const base = envBase || (isVercel ? 'https://summar-it.vercel.app' : 'http://localhost:3000')
      const apiUrl = `${base}/api/login`
      const body = role === 'student'
        ? { role, studentId: userId, password }
        : role === 'coordinator'
          ? { role, coordinatorId: Number(userId), password }
          : { role }

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!resp.ok) {
        const t = await resp.text().catch(() => '')
        throw new Error(t || 'Login failed')
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
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#111827' }}>Welcome</h2>
        <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
          {error && (
            <div style={{ padding: 10, borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>{error}</div>
          )}
          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
            style={{ padding: 12, borderRadius: 6, border: '1px solid #d1d5db', outline: 'none' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{ padding: 12, borderRadius: 6, border: '1px solid #d1d5db', outline: 'none' }}
          />
          <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '12px 16px', borderRadius: 6, background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
