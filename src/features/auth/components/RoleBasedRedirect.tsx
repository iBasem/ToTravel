
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';

export function RoleBasedRedirect() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      return;
    }


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


      if (from) {
        if (profile.role === 'admin' && from.startsWith('/admin')) {
          navigate(from, { replace: true });
        } else if (profile.role === 'agency' && (from.startsWith('/travel_agency') || from.startsWith('/packages'))) {
          navigate(from, { replace: true });
        } else if (profile.role === 'traveler' && (from.startsWith('/traveler') || from === '/')) {
          navigate(from, { replace: true });
        } else {
          navigate(defaultPath, { replace: true });
        }
      } else {
        navigate(defaultPath, { replace: true });
      }
    } else if (!loading && !user) {
    }
  }, [user, profile, loading, navigate, location]);

  return null;
}
