import type { TFunction } from "i18next";
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
  BadgePercent,
  MapPin,
  MessageSquare,
  ListTodo,
  History,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  /** Group heading; empty string renders the items without a heading. */
  label: string;
  items: AdminNavItem[];
}

/**
 * Single source of truth for admin navigation — consumed by both the
 * desktop AdminSidebar and the mobile Sheet in AdminHeader so the two
 * can never drift apart.
 */
export function getAdminNavGroups(t: TFunction): AdminNavGroup[] {
  return [
    {
      label: "",
      items: [
        { title: t("adminDashboard.overview", "Overview"), url: "/admin", icon: BarChart3 },
      ],
    },
    {
      label: t("admin.navMarketplace", "Marketplace"),
      items: [
        { title: t("adminDashboard.packages", "Packages"), url: "/admin/packages", icon: Package },
        { title: t("adminDashboard.agencies", "Agencies"), url: "/admin/agencies", icon: Building2 },
        { title: t("adminDashboard.travelers", "Travelers"), url: "/admin/travelers", icon: Users },
        { title: t("adminDashboard.bookings", "Bookings"), url: "/admin/bookings", icon: BookOpen },
        { title: t("adminDeals.nav", "Deals"), url: "/admin/deals", icon: BadgePercent },
        { title: t("adminDashboard.reviews", "Reviews"), url: "/admin/reviews", icon: Star },
        { title: t("adminDashboard.messages", "Messages"), url: "/admin/messages", icon: MessageSquare },
      ],
    },
    {
      label: t("admin.navPlatform", "Platform"),
      items: [
        { title: t("adminDashboard.destinations", "Destinations"), url: "/admin/destinations", icon: MapPin },
        { title: t("adminDashboard.content", "Content"), url: "/admin/content", icon: FileText },
        { title: t("adminDashboard.financials", "Financials"), url: "/admin/financials", icon: DollarSign },
        { title: t("adminDashboard.reports", "Reports"), url: "/admin/reports", icon: BarChart3 },
      ],
    },
    {
      label: t("admin.navAdministration", "Administration"),
      items: [
        { title: t("adminDashboard.pendingActions", "Pending Actions"), url: "/admin/actions", icon: ListTodo },
        { title: t("adminDashboard.activityLog", "Activity Log"), url: "/admin/activity", icon: History },
        { title: t("adminDashboard.settings", "Settings"), url: "/admin/settings", icon: Settings },
      ],
    },
  ];
}

export function isNavItemActive(url: string, pathname: string): boolean {
  return url === "/admin" ? pathname === "/admin" : pathname.startsWith(url);
}
