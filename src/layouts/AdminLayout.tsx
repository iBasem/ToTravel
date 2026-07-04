
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { SidebarProvider } from "@/ui/sidebar";

const AdminLayout = () => {
  return (
    <div
      className="min-h-screen flex w-full bg-muted/30"
    >
      {/* Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        <AdminHeader />
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
