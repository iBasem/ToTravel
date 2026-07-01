import { Search, Bell, ChevronDown, Menu, Shield } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/ui/sheet";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/ui/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Package,
  Users,
  Building2,
  FileText,
  DollarSign,
  Settings,
  BookOpen,
  Star,
} from "lucide-react";

export function AdminHeader() {
  const { profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  const menuItems = [
    { title: t('adminDashboard.overview', "Overview"), url: "/admin", icon: BarChart3 },
    { title: t('adminDashboard.packages', "Packages"), url: "/admin/packages", icon: Package },
    { title: t('adminDashboard.agencies', "Agencies"), url: "/admin/agencies", icon: Building2 },
    { title: t('adminDashboard.travelers', "Travelers"), url: "/admin/travelers", icon: Users },
    { title: t('adminDashboard.bookings', "Bookings"), url: "/admin/bookings", icon: BookOpen },
    { title: t('adminDashboard.reviews', "Reviews"), url: "/admin/reviews", icon: Star },
    { title: t('adminDashboard.content', "Content"), url: "/admin/content", icon: FileText },
    { title: t('adminDashboard.financials', "Financials"), url: "/admin/financials", icon: DollarSign },
    { title: t('adminDashboard.reports', "Reports"), url: "/admin/reports", icon: BarChart3 },
    { title: t('adminDashboard.settings', "Settings"), url: "/admin/settings", icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
              <div className="flex flex-col h-full bg-white">
                {/* Brand Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Admin</span>
                  </div>
                </div>

                {/* Navigation Menu */}
                <div className="px-3 py-4 flex-1">
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.url === "/admin"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm w-full text-start ${isActive
                            ? `bg-purple-50 text-purple-700 font-semibold shadow-sm border-s-4 border-purple-600`
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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

          {/* Search Bar - hidden on mobile for admin? or keep it? */}
          <div className="relative flex-1 max-w-xs sm:max-w-md hidden sm:block">
            {/* Admin global search placeholder */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-semibold text-gray-900">Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <LanguageSwitcher />

          <Button variant="ghost" size="sm" className="relative p-1 sm:p-2">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 lg:p-2">
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-start">
                  <div className="text-xs sm:text-sm font-medium">Administrator</div>
                </div>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 hidden md:block rtl-flip" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48 sm:w-56">
              <DropdownMenuLabel>{t('agencyDashboard.myAccount', 'My Account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>{t('agencyDashboard.logout', 'Logout')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
