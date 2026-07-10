
import { useAuth } from '@/features/auth/context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'traveler' | 'agency' | 'admin'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />
    }
    const authType = requiredRole === 'agency' ? 'agency' : 'traveler'
    return <Navigate to={`/auth?type=${authType}`} state={{ from: location }} replace />
  }

  // The profile row loads shortly after the session on a hard page load;
  // redirecting before it arrives would bounce deep links to the wrong home.
  if (requiredRole && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (requiredRole && profile?.role !== requiredRole) {
    const redirectPath = profile?.role === 'admin' ? '/admin' :
      profile?.role === 'agency' ? '/travel_agency' :
        '/traveler/dashboard'
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}
