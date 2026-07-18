
import { useAuth } from '@/features/auth/context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/ui/button'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'traveler' | 'agency' | 'admin'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading, profileError, retryProfile, signOut } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

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
  // A FAILED fetch gets a retry screen, not an infinite spinner (AGY-12).
  if (requiredRole && !profile) {
    if (profileError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <p className="text-sm text-muted-foreground mb-4">
              {t('auth.profileLoadFailed', "We couldn't load your account profile. Check your connection and try again.")}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => void retryProfile()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {t('common.retry', 'Retry')}
              </Button>
              <Button variant="outline" onClick={() => void signOut()}>
                {t('common.signOut', 'Sign Out')}
              </Button>
            </div>
          </div>
        </div>
      )
    }
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
