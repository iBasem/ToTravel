import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { AgencyStatusGuard } from "./components/AgencyStatusGuard";
import { SidebarProvider } from "@/ui/sidebar";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ManagePackages from "@/features/packages/pages/ManagePackages";
import CreatePackage from "@/features/packages/pages/CreatePackage";
import EditPackage from "@/features/packages/pages/EditPackage";
import ManageDepartures from "@/features/packages/pages/ManageDepartures";
import PackageDetails from "@/features/packages/pages/PackageDetails";
import AgencyBookings from "@/features/bookings/pages/AgencyBookings";
import AgencyCalendar from "./pages/AgencyCalendar";
import Travelers from "./pages/Travelers";
import Gallery from "./pages/Gallery";
import Messages from "./pages/Messages";
import Deals from "./pages/Deals";
import Feedback from "./pages/Feedback";

export const AgencyRoutes = () => {
    return (
        <ProtectedRoute requiredRole="agency">
            <AgencyStatusGuard>
            <SidebarProvider>
                <Routes>
                    <Route element={<DashboardLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="packages" element={<ManagePackages />} />
                        <Route path="packages/create" element={<CreatePackage />} />
                        <Route path="packages/:id/edit" element={<EditPackage />} />
                        <Route path="packages/:id/departures" element={<ManageDepartures />} />
                        <Route path="packages/:id" element={<PackageDetails />} />
                        <Route path="bookings" element={<AgencyBookings />} />
                        <Route path="calendar" element={<AgencyCalendar />} />
                        <Route path="travelers" element={<Travelers />} />
                        <Route path="gallery" element={<Gallery />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="deals" element={<Deals />} />
                        <Route path="feedback" element={<Feedback />} />
                    </Route>
                </Routes>
            </SidebarProvider>
            </AgencyStatusGuard>
        </ProtectedRoute>
    );
};
