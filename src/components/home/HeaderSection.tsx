import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X, Users, Building, LogOut, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderSection() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Set document direction on mount and language change
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLogout = async () => {
    await signOut();
  };

  const getDashboardPath = () => {
    if (!profile?.role) return '/';
    switch (profile.role) {
      case 'admin':
        return '/admin';
      case 'agency':
        return '/travel_agency';
      case 'traveler':
        return '/traveler/dashboard';
      default:
        return '/';
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email || 'User';
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'admin':
        return t('common.admin', 'Admin');
      case 'agency':
        return t('common.agency', 'Agency');
      case 'traveler':
        return t('common.traveler', 'Traveler');
      default:
        return '';
    }
  };

  return (
    <header className="bg-white shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600">travelle</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/packages" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.packages')}
            </Link>
            <Link to="/destinations" className="text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.destinations')}
            </Link>
          </nav>

          {/* Desktop Auth Buttons & Language Switcher */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            {!loading && user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url || undefined} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align={i18n.language === 'ar' ? 'start' : 'end'} forceMount>
                  <div className={`flex flex-col space-y-1 p-2 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-blue-600 font-medium">
                      {getRoleLabel()}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardPath())} className={i18n.language === 'ar' ? 'flex-row-reverse' : ''}>
                    <LayoutDashboard className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.dashboard', 'Dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className={`text-red-600 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <LogOut className={`h-4 w-4 ${i18n.language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.logout', 'Logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !loading ? (
              <>
                <Link to="/auth?type=traveler">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {t('common.traveler')}
                  </Button>
                </Link>
                <Link to="/auth?type=agency">
                  <Button size="sm" className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {t('common.agency')}
                  </Button>
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-3">
              {/* Navigation Links */}
              <Link
                to="/"
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/packages"
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.packages')}
              </Link>
              <Link
                to="/destinations"
                className="block py-2 text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.destinations')}
              </Link>
              
              {/* Auth Section */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                {!loading && user && profile ? (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{getUserDisplayName()}</p>
                        <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
                      </div>
                    </div>
                    <Link to={getDashboardPath()} onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <LayoutDashboard className="w-4 h-4 me-2" />
                        {t('nav.dashboard', 'Dashboard')}
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-red-600"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="w-4 h-4 me-2" />
                      {t('nav.logout', 'Logout')}
                    </Button>
                  </>
                ) : !loading ? (
                  <>
                    <Link to="/auth?type=traveler" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Users className="w-4 h-4 me-2" />
                        {t('nav.travelerLogin')}
                      </Button>
                    </Link>
                    <Link to="/auth?type=agency" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="w-full justify-start">
                        <Building className="w-4 h-4 me-2" />
                        {t('nav.agencyLogin')}
                      </Button>
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
