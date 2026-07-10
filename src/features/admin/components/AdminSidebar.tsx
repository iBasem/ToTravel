import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/ui/sidebar";
import { getAdminNavGroups, isNavItemActive } from "./nav-items";

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.dir() === 'rtl';

  const navGroups = getAdminNavGroups(t);
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
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold">{t('common.admin')}</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-2 flex-1 overflow-y-auto">
          {navGroups.map((group, groupIndex) => (
            <SidebarGroup key={group.label || groupIndex} className="p-0 py-2">
              {group.label && !isCollapsed && (
                <SidebarGroupLabel className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(item.url, location.pathname);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/admin"}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 text-sm w-full text-start ${isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span className="truncate">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
