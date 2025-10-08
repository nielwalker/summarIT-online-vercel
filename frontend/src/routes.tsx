import { createHashRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
// Auth not required per latest requirement
 
const LoginPage = lazy(() => import('./screens/LoginPage'))
const StudentLoginPage = lazy(() => import('./screens/StudentLoginPage'))
const CoordinatorLoginPage = lazy(() => import('./screens/CoordinatorLoginPage'))
const ChairmanLoginPage = lazy(() => import('./screens/ChairmanLoginPage'))
const StudentDashboard = lazy(() => import('./screens/student/StudentDashboard'))
const CoordinatorDashboard = lazy(() => import('./screens/coordinator/CoordinatorDashboard'))
const ChairmanDashboard = lazy(() => import('./screens/chairman/ChairmanDashboard'))

const fallbackEl = <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>

export const router = createHashRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Suspense fallback={fallbackEl}><LoginPage /></Suspense> },
  { path: '/login/student', element: <Suspense fallback={fallbackEl}><StudentLoginPage /></Suspense> },
  { path: '/login/coordinator', element: <Suspense fallback={fallbackEl}><CoordinatorLoginPage /></Suspense> },
  { path: '/login/chairman', element: <Suspense fallback={fallbackEl}><ChairmanLoginPage /></Suspense> },
  {
    path: '/student',
    element: <Suspense fallback={fallbackEl}><StudentDashboard /></Suspense>,
  },
  {
    path: '/coordinator',
    element: <Suspense fallback={fallbackEl}><CoordinatorDashboard /></Suspense>,
  },
  {
    path: '/chairman',
    element: <Suspense fallback={fallbackEl}><ChairmanDashboard /></Suspense>,
  },
])


