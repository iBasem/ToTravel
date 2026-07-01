
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';

export function RoleBasedRedirect() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      console.log('RoleBasedRedirect - Still loading');
      return;
    }

    console.log('RoleBasedRedirect - User:', user?.id, 'Profile:', profile?.role, 'Current path:', location.pathname);

    if (user && profile) {
      const from = location.state?.from?.pathname;
      
      let defaultPath = '/';
      if (profile.role === 'admin') {
        defaultPath = '/admin';
      } else if (profile.role === 'agency') {
        defaultPath = '/travel_agency';
      } else if (profile.role === 'traveler') {
        defaultPath = '/traveler/dashboard';
      }

      console.log('Default path for role:', defaultPath, 'Intended path:', from);

      if (from) {
        if (profile.role === 'admin' && from.startsWith('/admin')) {
          console.log('Redirecting admin to intended path:', from);
          navigate(from, { replace: true });
        } else if (profile.role === 'agency' && (from.startsWith('/travel_agency') || from.startsWith('/packages'))) {
          console.log('Redirecting agency to intended path:', from);
          navigate(from, { replace: true });
        } else if (profile.role === 'traveler' && (from.startsWith('/traveler') || from === '/')) {
          console.log('Redirecting traveler to intended path:', from);
          navigate(from, { replace: true });
        } else {
          console.log('Redirecting to default path due to role mismatch:', defaultPath);
          navigate(defaultPath, { replace: true });
        }
      } else {
        console.log('No intended path, redirecting to default:', defaultPath);
        navigate(defaultPath, { replace: true });
      }
    } else if (!loading && !user) {
      console.log('No user found, staying on current page');
    }
  }, [user, profile, loading, navigate, location]);

  return null;
}
