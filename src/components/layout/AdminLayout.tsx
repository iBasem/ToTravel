
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
      <div 
        className="min-h-screen flex w-full bg-muted/30" 
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col w-full min-w-0">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
