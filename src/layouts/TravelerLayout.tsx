import { Outlet } from "react-router-dom";
import { TravelerSidebar } from "./TravelerSidebar";
import { TravelerHeader } from "./TravelerHeader";
import { SidebarProvider, SidebarInset } from "@/ui/sidebar";

const TravelerLayout = () => {
  return (
    <div
      className="min-h-screen flex w-full bg-muted/30"
    >
      {/* Sidebar - anchored based on language direction */}
      <TravelerSidebar />

      {/* Main content area */}
      <SidebarInset className="flex-1 flex flex-col w-full min-w-0">
        <TravelerHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default TravelerLayout;
