import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type React from 'react'

type RequireAuthProps = {
  children: React.ReactElement
  roles?: Array<'student' | 'coordinator' | 'chairman'>
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const { token, role } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (roles && role && !roles.includes(role)) return <Navigate to={`/${role}`} replace />
  return children
}


