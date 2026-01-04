
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Users,
  Building2,
  Package,
  BookOpen,
  DollarSign,
  Settings,
  MapPin,
  FileText,
  TrendingUp
} from "lucide-react";

export function AdminSidebar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const adminMenuItems = [
    { title: t('dashboard.overview'), url: "/admin", icon: BarChart3 },
    { title: t('admin.travelers', 'Travelers'), url: "/admin/travelers", icon: Users },
    { title: t('admin.travelAgencies', 'Travel Agencies'), url: "/admin/agencies", icon: Building2 },
    { title: t('admin.tourPackages', 'Tour Packages'), url: "/admin/packages", icon: Package },
    { title: t('dashboard.bookings'), url: "/admin/bookings", icon: BookOpen },
    { title: t('admin.financials', 'Financials'), url: "/admin/financials", icon: DollarSign },
    { title: t('admin.reports', 'Reports'), url: "/admin/reports", icon: TrendingUp },
    { title: t('admin.content', 'Content'), url: "/admin/content", icon: FileText },
    { title: t('dashboard.settings'), url: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-white border-gray-200 flex flex-col" style={{ borderInlineEnd: '1px solid #e5e7eb' }}>
      {/* Brand Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Travelle</span>
            <p className="text-xs text-gray-500">{t('admin.adminPanel', 'Admin Panel')}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-3 sm:px-4 py-4">
        <nav className="space-y-1">
          {adminMenuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.url === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${
                  isActive
                    ? `bg-blue-50 text-blue-700 font-semibold shadow-sm ${isRTL ? 'border-r-4 border-blue-600' : 'border-l-4 border-blue-600'}`
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Upgrade Section */}
      <div className="mt-auto p-3 sm:p-4 border-t border-gray-200">
        <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
            {t('admin.systemAnalytics', 'System Analytics')}
          </h3>
          <p className="text-xs sm:text-sm text-blue-700 mb-3 opacity-90">
            {t('admin.monitorPlatform', 'Monitor platform performance')}
          </p>
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm">
            {t('admin.viewAnalytics', 'View Analytics')}
          </button>
        </div>
      </div>
    </div>
  );
}
