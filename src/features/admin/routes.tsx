import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { SidebarProvider } from "@/ui/sidebar";

import AdminDashboard from "./pages/AdminDashboard";
import TravelerManagement from "./pages/TravelerManagement";
import AgencyManagement from "./pages/AgencyManagement";
import AdminPackageManagement from "./pages/AdminPackageManagement";
import AdminBookingManagement from "@/features/bookings/pages/AdminBookings";
import ReviewManagement from "./pages/ReviewManagement";
import FinancialManagement from "./pages/FinancialManagement";
import ReportsPage from "./pages/ReportsPage";
import ContentManagement from "./pages/ContentManagement";
import AdminSettings from "./pages/AdminSettings";

export const AdminRoutes = () => {
    return (
        <Routes>
            <Route
                element={
                    <ProtectedRoute requiredRole="admin">
                        <SidebarProvider>
                            <AdminLayout />
                        </SidebarProvider>
                    </ProtectedRoute>
                }
            >
                <Route index element={<AdminDashboard />} />
                <Route path="travelers" element={<TravelerManagement />} />
                <Route path="agencies" element={<AgencyManagement />} />
                <Route path="packages" element={<AdminPackageManagement />} />
                <Route path="bookings" element={<AdminBookingManagement />} />
                <Route path="reviews" element={<ReviewManagement />} />
                <Route path="financials" element={<FinancialManagement />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="content" element={<ContentManagement />} />
                <Route path="settings" element={<AdminSettings />} />
            </Route>
        </Routes>
    );
};
