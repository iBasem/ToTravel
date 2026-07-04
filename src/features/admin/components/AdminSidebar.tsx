import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Package,
  Users,
  Building2,
  FileText,
  DollarSign,
  Settings,
  Shield,
  BookOpen,
  Star
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

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
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

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className="hidden lg:flex border-border"
      collapsible="icon"
      side={isRTL ? "right" : "left"}
    >
      <SidebarContent className="bg-background">
        {/* Brand Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold">{t('common.admin')}</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="px-3 py-4 flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) => {
                        return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm w-full text-start ${isActive
                          ? `bg-purple-50 text-purple-700 font-semibold shadow-sm border-s-4 border-purple-600`
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
      </SidebarContent>
    </Sidebar>
  );
}
