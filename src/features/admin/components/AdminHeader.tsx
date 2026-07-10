import { Bell, ChevronDown, Menu, Shield } from "lucide-react";
import { Button } from "@/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { useAuth } from "@/features/auth/context/AuthContext";
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
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAdminNavGroups, isNavItemActive } from "./nav-items";

/** Open pending-action count for the header bell. Shares the
 * ['admin','pending-actions'] prefix so queue mutations refresh it. */
function usePendingActionsCount() {
  return useQuery({
    queryKey: ['admin', 'pending-actions', 'count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('admin_pending_actions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
}

export function AdminHeader() {
  const { profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';
  const { data: pendingCount = 0 } = usePendingActionsCount();

  const navGroups = getAdminNavGroups(t);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4">
        {/* Mobile menu and title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden p-1 sm:p-2" aria-label={t('common.openMenu', 'Open menu')}>
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
              <SheetTitle className="sr-only">{t('common.admin')}</SheetTitle>
              <div className="flex flex-col h-full bg-background">
                {/* Brand Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-foreground">{t('common.admin')}</span>
                  </div>
                </div>

                {/* Navigation Menu — same source as the desktop sidebar */}
                <div className="px-3 py-2 flex-1 overflow-y-auto">
                  {navGroups.map((group, groupIndex) => (
                    <div key={group.label || groupIndex} className="py-2">
                      {group.label && (
                        <div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                          {group.label}
                        </div>
                      )}
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          // Radix Slot (SheetClose asChild) stringifies a
                          // function className, so resolve the active state
                          // here and pass a plain string.
                          const isActive = isNavItemActive(item.url, location.pathname);
                          return (
                            <SheetClose asChild key={item.url}>
                              <NavLink
                                to={item.url}
                                end={item.url === "/admin"}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 text-sm w-full text-start ${isActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                              >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="truncate">{item.title}</span>
                              </NavLink>
                            </SheetClose>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="relative flex-1 max-w-xs sm:max-w-md hidden sm:block">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{t('admin.adminPortal', 'Admin Portal')}</span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <LanguageSwitcher />

          <ThemeToggle />

          <Button
            variant="ghost"
            size="sm"
            className="relative p-1 sm:p-2"
            aria-label={
              pendingCount > 0
                ? t('admin.pendingNotifications', '{{count}} pending actions', { count: pendingCount })
                : t('common.notifications', 'Notifications')
            }
            onClick={() => navigate('/admin/actions')}
          >
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 font-semibold text-center tabular-nums">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 lg:p-2">
                <Avatar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {[profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('') || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-start">
                  <div className="text-xs sm:text-sm font-medium">{t('admin.administrator', 'Administrator')}</div>
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
