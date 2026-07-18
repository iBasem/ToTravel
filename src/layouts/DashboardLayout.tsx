import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { SidebarInset } from "@/ui/sidebar";
import { ErrorBoundary } from "@/ui/error-boundary";

// Route guarding lives in ProtectedRoute (one component above in
// AgencyRoutes) — the duplicate copy here dropped the deep-link state and
// drifted from the real gate (audit AGY-46).
const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar - Position is handled by AppSidebar using side prop */}
      <AppSidebar />

      {/* Main content area - flows naturally based on direction */}
      <SidebarInset className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main id="main-content" className="flex-1 p-4 lg:p-6 xl:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            {/* Route-level boundary (AGY-30): a render crash in one page must
                not white-out the whole shell. Keyed on pathname so navigating
                away resets the boundary. */}
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default DashboardLayout;
