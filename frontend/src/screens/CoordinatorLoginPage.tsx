import { useNavigate } from 'react-router-dom'

export default function CoordinatorLoginPage() {
  const navigate = useNavigate()

  const handleLogin = () => {
    // Direct login without API call - similar to chairman
    localStorage.setItem('token', `token-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem('role', 'coordinator')
    localStorage.setItem('userName', 'Coordinator')
    navigate('/coordinator')
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
        <div style={{ display: 'grid', gap: 12, width: '100%' }}>
          <p>Click continue to access the Coordinator Dashboard</p>
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
