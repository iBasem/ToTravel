import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Package,
  Calendar,
  Users,
  UserCheck,
  Images,
  MessageSquare,
  Tag,
  Star,
  BookOpen,
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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  const menuItems = [
    { title: t('dashboard.overview'), url: "/travel_agency", icon: BarChart3 },
    { title: t('dashboard.packages'), url: "/travel_agency/packages", icon: Package },
    { title: t('dashboard.bookings'), url: "/travel_agency/bookings", icon: BookOpen },
    { title: t('dashboard.calendar'), url: "/travel_agency/calendar", icon: Calendar },
    { title: t('dashboard.travelers'), url: "/travel_agency/travelers", icon: Users },
    { title: t('dashboard.guides'), url: "/travel_agency/guides", icon: UserCheck },
    { title: t('dashboard.gallery'), url: "/travel_agency/gallery", icon: Images },
    { title: t('dashboard.messages'), url: "/travel_agency/messages", icon: MessageSquare },
    { title: t('dashboard.deals'), url: "/travel_agency/deals", icon: Tag },
    { title: t('dashboard.feedback'), url: "/travel_agency/feedback", icon: Star },
  ];

  console.log('AppSidebar - Current path:', location.pathname, 'Sidebar state:', state);

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className="hidden lg:flex border-border"
      collapsible="icon"
      side={isRTL ? "right" : "left"}
    >
      <SidebarContent className="bg-background">
        {/* Brand Header - anchored to start */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold">ToTravel</span>
            )}
          </div>
        </div>

        {/* Navigation Menu - flows with direction */}
        <SidebarGroup className="px-3 py-4 flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/travel_agency"}
                      className={({ isActive }) => {
                        return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm w-full text-start ${isActive
                          ? `bg-primary/10 text-primary font-semibold shadow-sm border-s-4 border-primary`
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`;
                      }}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0 rtl-flip" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Upgrade Section - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <div className={`bg-primary/5 border border-primary/20 rounded-xl p-4 text-start`}>
              <h3 className="font-semibold text-primary mb-2 text-sm">
                {t('agencyDashboard.enhanceExperience')}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {t('agencyDashboard.unlockPremium')}
              </p>
              <button className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm">
                {t('agencyDashboard.upgradeNow')}
              </button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}