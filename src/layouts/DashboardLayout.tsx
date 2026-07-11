import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { SidebarProvider, SidebarInset } from "@/ui/sidebar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const DashboardLayout = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?type=agency" replace />;
  }

  if (profile?.role !== 'agency') {
    const redirectPath = profile?.role === 'admin' ? '/admin' : '/traveler/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar - Position is handled by AppSidebar using side prop */}
      <AppSidebar />

      {/* Main content area - flows naturally based on direction */}
      <SidebarInset className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main id="main-content" className="flex-1 p-4 lg:p-6 xl:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default DashboardLayout;
