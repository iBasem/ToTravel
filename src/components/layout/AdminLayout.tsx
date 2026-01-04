
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminSidebar } from "../admin/AdminSidebar";
import { AdminHeader } from "../admin/AdminHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

const AdminLayout = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col w-full">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
