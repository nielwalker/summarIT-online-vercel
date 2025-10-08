import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ChairmanLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (username.trim().toLowerCase() === 'chairman' && password === 'chairman') {
      localStorage.setItem('token', `token-${Math.random().toString(36).slice(2)}`)
      localStorage.setItem('role', 'chairman')
      localStorage.setItem('userName', 'Chairman')
      navigate('/chairman')
    } else {
      setError('Invalid username or password')
    }
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
      <h2>Chairman Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, width: '100%' }}>
        {error && (
          <div style={{ padding: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6 }}>{error}</div>
        )}
        <label style={{ width: '100%' }}>
          <input 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
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
        <div style={{ fontSize: 12, color: '#6b7280' }}>Log in to Continue</div>
      </form>
      </div>
    </div>
  )
}
