// No router hook needed; we force hash navigation for Vercel reliability

export default function LoginPage() {

  return (
    <div style={{ maxWidth: 440, margin: '64px auto', padding: 16 }}>
      <h2>Select Your Role</h2>
      <div style={{ display: 'grid', gap: 16 }}>
        <button 
          onClick={() => { window.location.hash = '/login/student' }}
          style={{
            padding: '16px 24px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Student</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Login with your Student ID to submit weekly reports</div>
        </button>

        <button 
          onClick={() => { window.location.hash = '/login/coordinator' }}
          style={{
            padding: '16px 24px',
            fontSize: '16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Coordinator</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Login to view and manage student reports</div>
        </button>

        <button 
          onClick={() => { window.location.hash = '/login/chairman' }}
          style={{
            padding: '16px 24px',
            fontSize: '16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Chairman</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Login to register students and coordinators</div>
        </button>
      </div>
    </div>
  )
}


