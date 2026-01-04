import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TravelerSidebar } from "./TravelerSidebar";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TravelerHeader() {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className={`flex items-center justify-between px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Mobile menu and search */}
        <div className={`flex items-center gap-2 sm:gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden p-1 sm:p-2">
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
              <TravelerSidebar />
            </SheetContent>
          </Sheet>

          {/* Search bar - responsive */}
          <div className="relative flex-1 max-w-xs sm:max-w-md">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 ${isRTL ? 'right-2 sm:right-3' : 'left-2 sm:left-3'}`} />
            <Input
              placeholder={t('travelerDashboard.searchDestinationsTours')}
              className={`bg-gray-50 border-0 h-8 sm:h-9 lg:h-10 text-xs sm:text-sm ${isRTL ? 'pr-7 sm:pr-10' : 'pl-7 sm:pl-10'}`}
            />
          </div>
        </div>

        {/* Right side controls */}
        <div className={`flex items-center gap-1 sm:gap-2 lg:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Browse Tours link */}
          <Link 
            to="/" 
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium hidden sm:block"
          >
            {t('travelerDashboard.browseTours')}
          </Link>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-1 sm:p-2">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            <span className={`absolute w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-red-500 text-white text-[8px] sm:text-[10px] lg:text-xs rounded-full flex items-center justify-center ${isRTL ? '-top-0.5 -left-0.5 sm:-top-1 sm:-left-1' : '-top-0.5 -right-0.5 sm:-top-1 sm:-right-1'}`}>
              2
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 lg:p-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-[10px] sm:text-xs lg:text-sm">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className={`hidden md:block ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="text-xs sm:text-sm font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{t('common.traveler')}</div>
                </div>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 hidden md:block ${isRTL ? 'rotate-0' : ''}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48 sm:w-56">
              <DropdownMenuLabel>{t('travelerDashboard.myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/traveler/dashboard/profile" className="w-full cursor-pointer">{t('travelerDashboard.profile')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>{t('dashboard.settings')}</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                {t('travelerDashboard.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
