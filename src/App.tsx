
import { Toaster as Sonner } from "@/ui/sonner";
import { TooltipProvider } from "@/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import AuthPage from "@/features/auth/pages/AuthPage";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Home from "@/features/home/pages/Home";
import { PackagesRoutes } from "@/features/packages/routes";
import Destinations from "@/features/packages/pages/Destinations";
import NotFound from "./pages/NotFound";
import { AdminRoutes } from "@/features/admin/routes";
import { AgencyRoutes } from "@/features/agency/routes";
import { TravelerRoutes } from "@/features/traveler/routes";
import AdminAuth from "@/features/auth/pages/AdminAuth";
import { ErrorBoundary } from "@/ui/error-boundary";

const queryClient = new QueryClient();

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;

    // Add font family support for Arabic
    if (i18n.language === 'ar') {
      document.body.style.fontFamily = "var(--font-arabic)";
    } else {
      document.body.style.fontFamily = "var(--font-sans)";
    }
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/packages/*" element={<PackagesRoutes />} />
                <Route path="/destinations" element={<Destinations />} />

                {/* Protected Traveler Routes */}
                <Route path="/traveler/dashboard/*" element={<TravelerRoutes />} />

                {/* Protected Travel Agency Routes */}
                <Route path="/travel_agency/*" element={<AgencyRoutes />} />

                {/* Admin Auth Route - No signup, sign-in only */}
                <Route path="/admin/login" element={<AdminAuth />} />

                {/* Protected Admin Routes */}
                <Route path="/admin/*" element={<AdminRoutes />} />

                {/* Redirect legacy routes */}
                <Route path="/dashboard" element={<Navigate to="/travel_agency" replace />} />
                <Route path="/dashboard/*" element={<Navigate to="/travel_agency" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
