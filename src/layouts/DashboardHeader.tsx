import { useState } from "react";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { SidebarTrigger } from "@/ui/sidebar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUnreadMessages } from "@/features/agency/hooks/useUnreadMessages";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/ui/LanguageSwitcher";
import { ThemeToggle } from "@/ui/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Package,
  Calendar,
  Users,
  Images,
  MessageSquare,
  Tag,
  Star,
  BookOpen,
  MapPin
} from "lucide-react";

export function DashboardHeader() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useUnreadMessages();
  const [searchTerm, setSearchTerm] = useState("");
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (q) {
      navigate(`/travel_agency/packages?q=${encodeURIComponent(q)}`);
    }
  };

  const menuItems = [
    { title: t('dashboard.overview'), url: "/travel_agency", icon: BarChart3 },
    { title: t('dashboard.packages'), url: "/travel_agency/packages", icon: Package },
    { title: t('dashboard.bookings'), url: "/travel_agency/bookings", icon: BookOpen },
    { title: t('dashboard.calendar'), url: "/travel_agency/calendar", icon: Calendar },
    { title: t('dashboard.travelers'), url: "/travel_agency/travelers", icon: Users },
    { title: t('dashboard.gallery'), url: "/travel_agency/gallery", icon: Images },
    { title: t('dashboard.messages'), url: "/travel_agency/messages", icon: MessageSquare },
    { title: t('dashboard.deals'), url: "/travel_agency/deals", icon: Tag },
    { title: t('dashboard.feedback'), url: "/travel_agency/feedback", icon: Star },
  ];

  const getUserDisplayName = () => {
    if (!profile) return 'User';
    return profile.first_name ? `${profile.first_name} ${profile.last_name}`.trim() : profile.email;
  };

  const getUserRole = () => {
    if (!profile) return 'User';
    switch (profile.role) {
      case 'agency': return t('agencyDashboard.travelAgency');
      case 'admin': return 'Admin';
      case 'traveler': return t('common.traveler');
      default: return 'User';
    }
  };

  const getUserInitials = () => {
    if (!profile) return 'U';
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile.first_name) return profile.first_name[0].toUpperCase();
    if (profile.email) return profile.email[0].toUpperCase();
    return 'U';
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4">
        {/* Mobile menu and search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden p-1 sm:p-2">
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
              <div className="flex flex-col h-full bg-background">
                {/* Brand Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-foreground">ToTravel</span>
                  </div>
                </div>

                {/* Navigation Menu */}
                <div className="px-3 py-4 flex-1">
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.url === "/travel_agency"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 text-sm w-full text-start ${isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar collapse toggle */}
          <SidebarTrigger className="hidden lg:flex" />

          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs sm:max-w-md">
            <Search className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4 start-2 sm:start-3" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit(e);
              }}
              placeholder={t('agencyDashboard.searchPackages')}
              className="bg-muted border-0 h-8 sm:h-9 lg:h-10 text-xs sm:text-sm ps-7 sm:ps-10"
            />
          </form>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications: unread messages */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-1 sm:p-2"
            aria-label={t('agencyDashboard.notifications', 'Notifications')}
            onClick={() => navigate('/travel_agency/messages')}
          >
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            {unreadCount > 0 && (
              <span className="absolute min-w-[10px] h-2.5 sm:min-w-[12px] sm:h-3 lg:min-w-[16px] lg:h-4 px-0.5 bg-destructive text-destructive-foreground text-[8px] sm:text-[10px] lg:text-xs rounded-full flex items-center justify-center -top-0.5 end-0 sm:-top-1 sm:end-0 tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 lg:p-2">
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-[10px] sm:text-xs lg:text-sm">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-start">
                  <div className="text-xs sm:text-sm font-medium">{getUserDisplayName()}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">{getUserRole()}</div>
                </div>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 hidden md:block rtl-flip" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48 sm:w-56">
              <DropdownMenuLabel>{t('agencyDashboard.myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>{t('agencyDashboard.logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}