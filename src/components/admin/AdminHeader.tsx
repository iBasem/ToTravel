
import { Search, Bell, ChevronDown, Menu, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
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
import { useAuth } from "@/contexts/AuthContext";

export function AdminHeader() {
  const { signOut, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const handleLogout = async () => {
    await signOut();
  };
  
  const getInitials = () => {
    const first = profile?.first_name?.[0] || '';
    const last = profile?.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'AD';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className={`flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Mobile menu and search */}
        <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden p-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          {/* Search bar - responsive */}
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('admin.searchPlaceholder', 'Search users, tours, bookings...')}
              className={`bg-gray-50 border-0 h-9 sm:h-10 text-sm sm:text-base ${isRTL ? 'pr-10' : 'pl-10'}`}
            />
          </div>
        </div>

        {/* Right side controls */}
        <div className={`flex items-center gap-2 sm:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Admin Mode Badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            {t('admin.adminMode', 'Admin Mode')}
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className={`absolute w-3 h-3 sm:w-4 sm:h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center text-[10px] sm:text-xs ${isRTL ? '-top-1 -left-1' : '-top-1 -right-1'}`}>
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center gap-2 p-1 sm:p-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs sm:text-sm">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className={`hidden sm:block ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm font-medium">
                    {profile?.first_name || 'Admin'} {profile?.last_name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">{t('admin.systemAdmin', 'System Admin')}</div>
                </div>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
              <DropdownMenuLabel>{t('admin.adminAccount', 'Admin Account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{t('agencyDashboard.profile')}</DropdownMenuItem>
              <DropdownMenuItem>{t('admin.systemSettings', 'System Settings')}</DropdownMenuItem>
              <DropdownMenuItem>{t('admin.security', 'Security')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('agencyDashboard.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
