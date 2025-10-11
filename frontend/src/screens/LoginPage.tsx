import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../utils/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
      const apiUrl = getApiUrl('/api/login')
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
        
        // Show success message
        const roleName = role === 'student' ? 'Student' : role === 'coordinator' ? 'Coordinator' : 'Chairperson'
        setSuccessMessage(`Successfully logged in as ${roleName}`)
        
        // Navigate after a short delay to show the success message
        setTimeout(() => {
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
        }, 1500)
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
      backgroundImage: 'url(/loginbg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '48px 40px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/SummarIT png.png" alt="SummarIT" style={{ width: '320px', height: 'auto' }} />
          <p style={{ 
            marginTop: '16px', 
            fontSize: '16px', 
            color: '#4b5563',
            fontWeight: '500'
          }}>
            Please enter your login details below.
          </p>
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
          
          {successMessage && (
            <div style={{
              padding: '12px 16px',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: '500'
            }}>{successMessage}</div>
          )}
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
              <div style={{ width: '44px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
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
              <div style={{ width: '44px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
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
