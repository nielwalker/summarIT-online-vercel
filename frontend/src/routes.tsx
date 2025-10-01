import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
// Auth not required per latest requirement

const LoginPage = lazy(() => import('./screens/LoginPage'))
const StudentLoginPage = lazy(() => import('./screens/StudentLoginPage'))
const CoordinatorLoginPage = lazy(() => import('./screens/CoordinatorLoginPage'))
const ChairmanLoginPage = lazy(() => import('./screens/ChairmanLoginPage'))
const StudentDashboard = lazy(() => import('./screens/student/StudentDashboard'))
const CoordinatorDashboard = lazy(() => import('./screens/coordinator/CoordinatorDashboard'))
const ChairmanDashboard = lazy(() => import('./screens/chairman/ChairmanDashboard'))

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <Suspense fallback={null}><LoginPage /></Suspense> },
  { path: '/login/student', element: <Suspense fallback={null}><StudentLoginPage /></Suspense> },
  { path: '/login/coordinator', element: <Suspense fallback={null}><CoordinatorLoginPage /></Suspense> },
  { path: '/login/chairman', element: <Suspense fallback={null}><ChairmanLoginPage /></Suspense> },
  {
    path: '/student',
    element: <Suspense fallback={null}><StudentDashboard /></Suspense>,
  },
  {
    path: '/coordinator',
    element: <Suspense fallback={null}><CoordinatorDashboard /></Suspense>,
  },
  {
    path: '/chairman',
    element: <Suspense fallback={null}><ChairmanDashboard /></Suspense>,
  },
])


