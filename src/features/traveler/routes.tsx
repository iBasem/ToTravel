import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import { SidebarProvider } from "@/ui/sidebar";
import TravelerLayout from "@/layouts/TravelerLayout";
import TravelerDashboard from "./pages/TravelerDashboard";
import TravelerBookings from "@/features/bookings/pages/TravelerBookings";
import TravelerWishlist from "./pages/TravelerWishlist";
import TravelerReviews from "./pages/TravelerReviews";
import TravelerProfile from "./pages/TravelerProfile";
// Shared messaging UI — the page and its hooks are role-agnostic (they key
// everything on auth.uid() and resolve the other party's name themselves).
import Messages from "@/features/agency/pages/Messages";

export const TravelerRoutes = () => {
    return (
        <ProtectedRoute requiredRole="traveler">
            <SidebarProvider>
                <Routes>
                    <Route element={<TravelerLayout />}>
                        <Route index element={<TravelerDashboard />} />
                        <Route path="bookings" element={<TravelerBookings />} />
                        <Route path="wishlist" element={<TravelerWishlist />} />
                        <Route path="reviews" element={<TravelerReviews />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="profile" element={<TravelerProfile />} />
                    </Route>
                </Routes>
            </SidebarProvider>
        </ProtectedRoute>
    );
};
