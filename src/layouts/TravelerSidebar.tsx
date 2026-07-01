import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  BookOpen,
  Heart,
  Star,
  User,
  MapPin
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/ui/sidebar";

export function TravelerSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  const menuItems = [
    { title: t('dashboard.overview'), url: "/traveler/dashboard", icon: BarChart3 },
    { title: t('travelerDashboard.myBookings'), url: "/traveler/dashboard/bookings", icon: BookOpen },
    { title: t('travelerDashboard.myWishlist'), url: "/traveler/dashboard/wishlist", icon: Heart },
    { title: t('travelerDashboard.myReviews'), url: "/traveler/dashboard/reviews", icon: Star },
    { title: t('travelerDashboard.profile'), url: "/traveler/dashboard/profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/traveler/dashboard") return location.pathname === "/traveler/dashboard";
    return location.pathname.startsWith(path);
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className="hidden lg:flex border-border"
      collapsible="icon"
      side={isRTL ? "right" : "left"}
    >
      <SidebarContent className="bg-background">
        {/* Logo - anchored to start */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-primary">ToTravel</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="px-4 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/traveler/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-start ${isActive
                          ? `bg-primary/10 text-primary font-medium border-s-2 border-primary`
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CTA Card */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-start">
              <h3 className="font-medium text-primary mb-2">
                {t('travelerDashboard.planNextAdventure')}
              </h3>
              <NavLink to="/" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors block text-center">
                {t('travelerDashboard.browseTours')}
              </NavLink>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
