import type React from 'react'

type Props = { children: React.ReactNode }

export default function DashboardShell({ children }: Props) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      backgroundColor: '#f8fafc',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {children}
    </div>
  )
}


