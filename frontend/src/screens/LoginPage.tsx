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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '48px 40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/summarit logo.png" alt="SummarIT" style={{ width: '180px', height: 'auto' }} />
        </div>
        
        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '20px'
            }}>{error}</div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
              <div style={{ width: '44px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <span className="bi bi-person" aria-hidden="true">👤</span>
              </div>
              <input
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  background: 'transparent'
                }}
                placeholder="ID Number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
              <div style={{ width: '44px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <span aria-hidden="true">🔒</span>
              </div>
              <input
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  background: 'transparent'
                }}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#3b82f6')}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
