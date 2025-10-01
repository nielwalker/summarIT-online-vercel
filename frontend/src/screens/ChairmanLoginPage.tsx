import { useNavigate } from 'react-router-dom'

export default function ChairmanLoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    // Direct login without API call
    localStorage.setItem('token', `token-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem('role', 'chairman')
    localStorage.setItem('userName', 'Chairman')
    navigate('/chairman')
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
      <div style={{ display: 'grid', gap: 12, width: '100%' }}>
        <p>Click continue to access the Chairman Dashboard</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button type="button" onClick={() => navigate('/')}>
            Back
          </button>
          <button onClick={handleLogin}>
            Continue
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
