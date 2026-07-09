import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Wrap a route element to require authentication, optionally restricted to
 * specific roles. Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><Dashboard /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
