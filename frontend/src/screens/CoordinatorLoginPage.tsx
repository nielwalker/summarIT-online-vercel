import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function CoordinatorLoginPage() {
  const navigate = useNavigate()
  const [coordinatorId, setCoordinatorId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!coordinatorId) { setError('Coordinator ID is required'); return }
    if (password !== coordinatorId) { setError('Wrong Password'); return }
    // Call backend to validate coordinatorId and fetch sections
    const run = async () => {
      try {
        const envBase = (import.meta as any).env?.VITE_API_URL
        const isVercel = typeof window !== 'undefined' && /vercel\.app$/i.test(window.location.hostname)
        const base = envBase || (isVercel ? 'https://summar-it.vercel.app' : 'http://localhost:3000')
        const apiUrl = `${base}/api/login`
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'coordinator', coordinatorId: Number(coordinatorId), password })
        })
        if (!resp.ok) {
          const t = await resp.text().catch(() => '')
          throw new Error(t || 'Login failed')
        }
        const data = await resp.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', 'coordinator')
        localStorage.setItem('userName', data.userName || 'Coordinator')
        localStorage.setItem('coordinatorId', String(coordinatorId))
        if (Array.isArray(data.sections)) {
          localStorage.setItem('sections', JSON.stringify(data.sections))
        }
        navigate('/coordinator')
      } catch (err: any) {
        setError(err.message || 'Login failed')
      }
    }
    run()
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{ 
        maxWidth: 440, 
        width: '100%',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <h2>Coordinator Login</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, width: '100%' }}>
          {error && (
            <div style={{ padding: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6 }}>{error}</div>
          )}
          <label style={{ width: '100%' }}>
            <input 
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Coordinator ID"
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ width: '100%' }}>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ width: '100%' }}
            />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" onClick={() => navigate('/')}>Back</button>
            <button type="submit">Login</button>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Log in to Continue"</div>
        </form>
      </div>
    </div>
  )
}
